import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Award, BarChart3, LineChart, RefreshCw, Activity } from 'lucide-react';
import StatCard from '@/components/StatCard';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Configure axios with timeout and auth
const getAxiosConfig = () => {
  const token = localStorage.getItem('authToken');
  const config: any = {
    timeout: 10000, // 10 seconds timeout
  };
  
  if (token) {
    config.headers = {
      'Authorization': `Bearer ${token}`
    };
  }
  
  return config;
};

interface AnalyticsData {
  overview: any;
  scoreDistribution: any;
  performanceTrends: any;
  topPerformers: any;
  recentActivity: any;
}

const Analytics = () => {
  // State management
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: null,
    scoreDistribution: null,
    performanceTrends: null,
    topPerformers: null,
    recentActivity: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      setError(null);
      
      // Fetch all analytics endpoints in parallel
      const [overviewRes, distributionRes, trendsRes, performersRes, activityRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/overview`, getAxiosConfig()),
        axios.get(`${API_URL}/analytics/score-distribution`, getAxiosConfig()),
        axios.get(`${API_URL}/analytics/performance-trends`, getAxiosConfig()),
        axios.get(`${API_URL}/analytics/top-performers?limit=5`, getAxiosConfig()),
        axios.get(`${API_URL}/analytics/recent-activity?days=7`, getAxiosConfig())
      ]);

      setAnalyticsData({
        overview: overviewRes.data,
        scoreDistribution: distributionRes.data,
        performanceTrends: trendsRes.data,
        topPerformers: performersRes.data,
        recentActivity: activityRes.data
      });
      
      setLastUpdated(new Date());
      
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      let errorMessage = 'Failed to load analytics data. ';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please check if the backend server is running.';
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        errorMessage += 'Backend server is not available. Please start the backend server.';
      } else if (err.response) {
        errorMessage += `Server error: ${err.response.status} ${err.response.statusText}`;
      } else {
        errorMessage += 'Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    fetchAnalyticsData();
  };

  // Auto-refresh setup
  useEffect(() => {
    fetchAnalyticsData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      // Refresh every 30 seconds
      interval = setInterval(fetchAnalyticsData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Loading state
  if (isLoading && !analyticsData.overview) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analyticsData.overview) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { overview, scoreDistribution, performanceTrends, topPerformers } = analyticsData;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header with real-time controls */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Real-Time Analytics Dashboard</h1>
            <p className="text-gray-600">Live insights from your AI evaluation system</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Auto-refresh toggle */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-refresh</span>
            </label>
            
            {/* Manual refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Last updated info */}
        {lastUpdated && (
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <Activity className="h-4 w-4 mr-1" />
            Last updated: {lastUpdated.toLocaleTimeString()}
            {autoRefresh && <span className="ml-2 text-green-600">• Live</span>}
          </div>
        )}
      </div>

      {/* Overall Performance - Real Data */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Average Score" 
            value={overview?.data?.average_score ? `${overview.data.average_score}%` : 'N/A'} 
            icon={TrendingUp} 
            iconColor="text-green-600" 
            iconBgColor="bg-green-100"
            trend={overview?.data?.evaluation_growth > 0 ? "up" : "down"}
            subtitle={overview?.data?.evaluation_growth ? `${overview.data.evaluation_growth}%` : 'No change'}
          />
          <StatCard 
            title="Total Evaluations" 
            value={overview?.data?.total_evaluations?.toString() || '0'} 
            icon={BarChart3} 
            iconColor="text-blue-600" 
            iconBgColor="bg-blue-100"
            trend="up"
            subtitle={`${overview?.data?.recent_evaluations || 0} this month`}
          />
          <StatCard 
            title="Active Students" 
            value={overview?.data?.active_users?.toString() || '0'} 
            icon={Users} 
            iconColor="text-purple-600" 
            iconBgColor="bg-purple-100"
            trend="up"
            subtitle="With evaluations"
          />
          <StatCard 
            title="Question Papers" 
            value={overview?.data?.total_question_papers?.toString() || '0'} 
            icon={Award} 
            iconColor="text-yellow-600" 
            iconBgColor="bg-yellow-100"
            trend="up"
            subtitle="Available"
          />
        </div>
      </div>

      {/* Score Distribution - Real Data */}
      {scoreDistribution?.data?.distribution && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Score Distribution</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-6">
              Distribution of {scoreDistribution.data.total_evaluations} Evaluations
            </h3>
            <div className="flex items-end justify-between h-64 space-x-4">
              {scoreDistribution.data.distribution.map((item: any, index: number) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full flex justify-center mb-2">
                    <div 
                      className="bg-blue-500 rounded-t-lg transition-all duration-300 hover:bg-blue-600"
                      style={{ 
                        height: `${Math.max((item.percentage / 100) * 200, 10)}px`,
                        width: '60px'
                      }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium text-gray-700 text-center">
                    {item.range}
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {item.count} evaluations
                  </div>
                  <div className="text-xs text-blue-600 text-center">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Trends - Real Data */}
      {performanceTrends?.data?.trends && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Trends</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-6">Average Score Over Time</h3>
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 600 200">
                {/* Grid lines */}
                {[0, 50, 100, 150, 200].map((y) => (
                  <line
                    key={y}
                    x1="50"
                    y1={y}
                    x2="550"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Line chart */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  points={performanceTrends.data.trends.map((point: any, index: number) => {
                    const x = 50 + (index * (500 / Math.max(performanceTrends.data.trends.length - 1, 1)));
                    const y = 200 - ((point.score || 0) / 100) * 200;
                    return `${x},${y}`;
                  }).join(' ')}
                />
                
                {/* Data points */}
                {performanceTrends.data.trends.map((point: any, index: number) => {
                  const x = 50 + (index * (500 / Math.max(performanceTrends.data.trends.length - 1, 1)));
                  const y = 200 - ((point.score || 0) / 100) * 200;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#3b82f6"
                      className="hover:r-6 transition-all"
                    >
                      <title>{`${point.month}: ${point.score}% (${point.count} evaluations)`}</title>
                    </circle>
                  );
                })}
              </svg>
              
              {/* X-axis labels */}
              <div className="flex justify-between mt-2 px-12">
                {performanceTrends.data.trends.map((point: any, index: number) => (
                  <span key={index} className="text-sm text-gray-600">{point.month}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers - Real Data */}
      {topPerformers?.data?.top_performers && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Top Performers ({topPerformers.data.total_students} total students)
          </h2>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            {topPerformers.data.top_performers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Rank</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Student Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Average Score</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Evaluations</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topPerformers.data.top_performers.map((performer: any) => (
                      <tr key={performer.rank} className="hover:bg-white transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                            performer.rank === 1 ? 'bg-yellow-500' :
                            performer.rank === 2 ? 'bg-gray-400' :
                            performer.rank === 3 ? 'bg-orange-400' : 'bg-blue-500'
                          }`}>
                            {performer.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{performer.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{performer.average_score}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{performer.evaluations_completed}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{performer.efficiency}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>No evaluation data available yet.</p>
                <p className="text-sm">Start evaluating to see top performers!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics; 