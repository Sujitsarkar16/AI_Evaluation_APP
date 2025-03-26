import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

// Features
import { Dashboard } from "./features/dashboard";
import { Classes } from "./features/classes";
import { Evaluations } from "./features/evaluations";
import { Agents } from "./features/agents";
import { Analytics } from "./features/analytics";
import { QuestionPapers } from "./features/questionPapers";
import { Settings } from "./features/settings";
import { Notifications } from "./features/notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="classes" element={<Classes />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="agents" element={<Agents />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="question-papers" element={<QuestionPapers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
