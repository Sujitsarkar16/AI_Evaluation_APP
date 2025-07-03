"""
FastAPI router for analytics data
Provides real-time analytics from database collections
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from collections import defaultdict
from bson.objectid import ObjectId

from mongoDB.auth import get_current_user_optional
from mongoDB.db_config import (
    evaluations_collection, 
    question_papers_collection, 
    users_collection,
    upload_queue_collection,
    parse_json
)

logger = logging.getLogger(__name__)

analytics_router = APIRouter(tags=["analytics"])

@analytics_router.get("/overview", response_model=dict)
async def get_analytics_overview(
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get overview analytics including key metrics"""
    try:
        # Get current date for time-based queries
        now = datetime.now()
        last_month = now - timedelta(days=30)
        last_week = now - timedelta(days=7)
        
        # Total evaluations
        total_evaluations = evaluations_collection.count_documents({})
        recent_evaluations = evaluations_collection.count_documents({
            "created_at": {"$gte": last_month}
        })
        
        # Average score calculation
        pipeline = [
            {"$unwind": "$evaluations"},
            {"$group": {
                "_id": None,
                "avg_score": {"$avg": "$evaluations.percentage_score"},
                "total_scores": {"$sum": 1}
            }}
        ]
        avg_result = list(evaluations_collection.aggregate(pipeline))
        avg_score = round(avg_result[0]["avg_score"]) if avg_result and avg_result[0]["avg_score"] is not None else 0
        
        # Active users (users who have evaluations)
        active_users = len(evaluations_collection.distinct("student_id"))
        
        # Question papers count
        total_question_papers = question_papers_collection.count_documents({})
        
        # Upload queue stats
        total_uploads = upload_queue_collection.count_documents({})
        pending_uploads = upload_queue_collection.count_documents({"status": "pending"})
        
        return {
            "success": True,
            "data": {
                "total_evaluations": total_evaluations,
                "recent_evaluations": recent_evaluations,
                "average_score": avg_score,
                "active_users": active_users,
                "total_question_papers": total_question_papers,
                "total_uploads": total_uploads,
                "pending_uploads": pending_uploads,
                "evaluation_growth": round((recent_evaluations / max(total_evaluations - recent_evaluations, 1)) * 100),
                "last_updated": now.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting analytics overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics overview: {str(e)}"
        )

@analytics_router.get("/score-distribution", response_model=dict)
async def get_score_distribution(
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get score distribution data for analytics charts"""
    try:
        # Score distribution pipeline
        pipeline = [
            {"$unwind": "$evaluations"},
            {"$group": {
                "_id": {
                    "$switch": {
                        "branches": [
                            {"case": {"$lt": ["$evaluations.percentage_score", 21]}, "then": "0-20"},
                            {"case": {"$lt": ["$evaluations.percentage_score", 41]}, "then": "21-40"},
                            {"case": {"$lt": ["$evaluations.percentage_score", 61]}, "then": "41-60"},
                            {"case": {"$lt": ["$evaluations.percentage_score", 81]}, "then": "61-80"},
                            {"case": {"$gte": ["$evaluations.percentage_score", 81]}, "then": "81-100"}
                        ],
                        "default": "Unknown"
                    }
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        results = list(evaluations_collection.aggregate(pipeline))
        
        # Initialize all ranges
        ranges = ["0-20", "21-40", "41-60", "61-80", "81-100"]
        distribution = []
        total_count = sum(r["count"] for r in results)
        
        for range_val in ranges:
            result = next((r for r in results if r["_id"] == range_val), None)
            count = result["count"] if result else 0
            percentage = round((count / max(total_count, 1)) * 100)
            
            distribution.append({
                "range": range_val,
                "count": count,
                "percentage": percentage
            })
        
        return {
            "success": True,
            "data": {
                "distribution": distribution,
                "total_evaluations": total_count,
                "last_updated": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting score distribution: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get score distribution: {str(e)}"
        )

@analytics_router.get("/performance-trends", response_model=dict)
async def get_performance_trends(
    months: int = 6,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get performance trends over time"""
    try:
        # Get data for the last N months
        now = datetime.now()
        start_date = now - timedelta(days=months * 30)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {"$unwind": "$evaluations"},
            {"$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "avg_score": {"$avg": "$evaluations.percentage_score"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        
        results = list(evaluations_collection.aggregate(pipeline))
        
        # Format results
        trends = []
        month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        for result in results:
            month_name = month_names[result["_id"]["month"]]
            year = result["_id"]["year"]
            trends.append({
                "month": f"{month_name} {year}" if year != now.year else month_name,
                "score": round(result["avg_score"]) if result["avg_score"] is not None else 0,
                "count": result["count"]
            })
        
        # Fill missing months with zero values if needed
        if len(trends) < months:
            current = start_date
            existing_months = {f"{t['month']}": t for t in trends}
            
            filled_trends = []
            for i in range(months):
                month_date = now - timedelta(days=(months - i - 1) * 30)
                month_key = month_names[month_date.month]
                if month_date.year != now.year:
                    month_key += f" {month_date.year}"
                
                if month_key in existing_months:
                    filled_trends.append(existing_months[month_key])
                else:
                    filled_trends.append({
                        "month": month_key,
                        "score": 0,
                        "count": 0
                    })
            
            trends = filled_trends
        
        return {
            "success": True,
            "data": {
                "trends": trends[-months:],  # Ensure we only return requested months
                "last_updated": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting performance trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get performance trends: {str(e)}"
        )

@analytics_router.get("/top-performers", response_model=dict)
async def get_top_performers(
    limit: int = 10,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get top performing students based on average scores"""
    try:
        # Pipeline to get student performance
        pipeline = [
            {"$unwind": "$evaluations"},
            {"$group": {
                "_id": "$student_id",
                "avg_score": {"$avg": "$evaluations.percentage_score"},
                "total_evaluations": {"$sum": 1},
                "total_marks": {"$sum": "$evaluations.marks_obtained"},
                "max_marks": {"$sum": "$evaluations.max_marks"}
            }},
            {"$match": {"total_evaluations": {"$gte": 1}}},  # Only students with at least 1 evaluation
            {"$sort": {"avg_score": -1}},
            {"$limit": limit}
        ]
        
        results = list(evaluations_collection.aggregate(pipeline))
        
        # Get user details for top performers
        student_ids = [result["_id"] for result in results]
        
        # Separate valid ObjectIds from invalid ones (like 'anonymous')
        valid_object_ids = []
        for sid in student_ids:
            try:
                valid_object_ids.append(ObjectId(sid))
            except:
                # Skip invalid ObjectIds like 'anonymous'
                pass
        
        # Only query with valid ObjectIds
        students = []
        if valid_object_ids:
            students = list(users_collection.find(
                {"_id": {"$in": valid_object_ids}},
                {"first_name": 1, "last_name": 1, "username": 1, "email": 1}
            ))
        
        # Create lookup map for student details
        student_map = {str(student["_id"]): student for student in students}
        
        # Format top performers
        top_performers = []
        for index, result in enumerate(results):
            student_id = result["_id"]
            student = student_map.get(student_id, {})
            
            # Create display name
            if student.get("first_name") or student.get("last_name"):
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
            elif student.get("username"):
                name = student.get("username")
            elif student_id == "anonymous":
                name = "Anonymous Student"
            else:
                name = f"Student {student_id[:8] if len(str(student_id)) > 8 else student_id}"
            
            top_performers.append({
                "rank": index + 1,
                "student_id": student_id,
                "name": name,
                "average_score": f"{round(result['avg_score']) if result['avg_score'] is not None else 0}%",
                "evaluations_completed": result["total_evaluations"],
                "total_marks": result["total_marks"],
                "efficiency": round((result["total_marks"] / max(result["max_marks"], 1)) * 100)
            })
        
        return {
            "success": True,
            "data": {
                "top_performers": top_performers,
                "total_students": len(evaluations_collection.distinct("student_id")),
                "last_updated": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting top performers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get top performers: {str(e)}"
        )

@analytics_router.get("/recent-activity", response_model=dict)
async def get_recent_activity(
    days: int = 7,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get recent system activity for real-time analytics"""
    try:
        # Calculate date range
        now = datetime.now()
        start_date = now - timedelta(days=days)
        
        # Recent evaluations
        recent_evaluations = list(evaluations_collection.find(
            {"created_at": {"$gte": start_date}},
            {"created_at": 1, "student_id": 1, "summary.total_marks": 1, "summary.percentage": 1}
        ).sort("created_at", -1).limit(20))
        
        # Recent uploads
        recent_uploads = list(upload_queue_collection.find(
            {"created_at": {"$gte": start_date}},
            {"created_at": 1, "filename": 1, "status": 1, "user_id": 1}
        ).sort("created_at", -1).limit(20))
        
        # Recent question papers
        recent_papers = list(question_papers_collection.find(
            {"created_at": {"$gte": start_date}},
            {"created_at": 1, "title": 1, "creator_id": 1, "total_marks": 1}
        ).sort("created_at", -1).limit(20))
        
        # Activity by day
        daily_activity = defaultdict(lambda: {"evaluations": 0, "uploads": 0, "papers": 0})
        
        for eval_doc in recent_evaluations:
            day = eval_doc["created_at"].strftime("%Y-%m-%d")
            daily_activity[day]["evaluations"] += 1
        
        for upload_doc in recent_uploads:
            day = upload_doc["created_at"].strftime("%Y-%m-%d")
            daily_activity[day]["uploads"] += 1
        
        for paper_doc in recent_papers:
            day = paper_doc["created_at"].strftime("%Y-%m-%d")
            daily_activity[day]["papers"] += 1
        
        # Convert to list format
        activity_timeline = []
        for i in range(days):
            date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            activity_timeline.append({
                "date": date,
                "evaluations": daily_activity[date]["evaluations"],
                "uploads": daily_activity[date]["uploads"],
                "papers": daily_activity[date]["papers"]
            })
        
        activity_timeline.reverse()  # Show oldest to newest
        
        return {
            "success": True,
            "data": {
                "recent_evaluations": parse_json(recent_evaluations),
                "recent_uploads": parse_json(recent_uploads),
                "recent_papers": parse_json(recent_papers),
                "daily_activity": activity_timeline,
                "summary": {
                    "total_evaluations": len(recent_evaluations),
                    "total_uploads": len(recent_uploads),
                    "total_papers": len(recent_papers)
                },
                "last_updated": now.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting recent activity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recent activity: {str(e)}"
        )

@analytics_router.get("/health", response_model=dict)
async def analytics_health_check():
    """Health check for analytics service"""
    try:
        # Test database connectivity
        evaluations_count = evaluations_collection.count_documents({})
        
        return {
            "success": True,
            "message": "Analytics service is healthy",
            "data": {
                "evaluations_available": evaluations_count > 0,
                "database_connected": True,
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Analytics service health check failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        } 