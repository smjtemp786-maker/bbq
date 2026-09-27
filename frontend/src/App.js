import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { OfflineProvider } from "@/context/OfflineContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "@/pages/Login";

import StudentDashboard from "@/pages/student/StudentDashboard";
import Courses from "@/pages/student/Courses";
import CourseDetail from "@/pages/student/CourseDetail";
import Projects from "@/pages/student/Projects";
import Achievements from "@/pages/student/Achievements";
import Profile from "@/pages/student/Profile";
import CodingLab from "@/pages/labs/CodingLab";
import GameLab from "@/pages/labs/GameLab";
import RoboticsLab from "@/pages/labs/RoboticsLab";
import AILab from "@/pages/labs/AILab";
import QuizRunner from "@/pages/labs/QuizRunner";

import TrainerDashboard from "@/pages/trainer/TrainerDashboard";
import TrainerStudents from "@/pages/trainer/TrainerStudents";
import TrainerBatches from "@/pages/trainer/TrainerBatches";
import TrainerProjects from "@/pages/trainer/TrainerProjects";
import TrainerQuizzes from "@/pages/trainer/TrainerQuizzes";

import CenterDashboard from "@/pages/center/CenterDashboard";
import CenterBatches from "@/pages/center/CenterBatches";
import CenterStudents from "@/pages/center/CenterStudents";
import CenterTrainers from "@/pages/center/CenterTrainers";
import CenterCourses from "@/pages/center/CenterCourses";
import CenterAttendance from "@/pages/center/CenterAttendance";
import CenterAnalytics from "@/pages/center/CenterAnalytics";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCenters from "@/pages/admin/AdminCenters";
import AdminLicenses from "@/pages/admin/AdminLicenses";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminTrainers from "@/pages/admin/AdminTrainers";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";

const HOME = { super_admin: "/admin", center_admin: "/center", trainer: "/trainer", student: "/student" };

function RootRedirect() {
  const { user } = useAuth();
  if (user === null) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME[user.role] || "/login"} replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />

              {/* Student */}
              <Route element={<ProtectedRoute roles={["student"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/courses" element={<Courses />} />
                <Route path="/student/courses/:courseId" element={<CourseDetail />} />
                <Route path="/student/coding-lab" element={<CodingLab />} />
                <Route path="/student/game-lab" element={<GameLab />} />
                <Route path="/student/robotics-lab" element={<RoboticsLab />} />
                <Route path="/student/ai-lab" element={<AILab />} />
                <Route path="/student/projects" element={<Projects />} />
                <Route path="/student/quizzes/:quizId" element={<QuizRunner />} />
                <Route path="/student/achievements" element={<Achievements />} />
                <Route path="/student/profile" element={<Profile />} />
              </Route>

              {/* Trainer */}
              <Route element={<ProtectedRoute roles={["trainer"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/trainer" element={<TrainerDashboard />} />
                <Route path="/trainer/students" element={<TrainerStudents />} />
                <Route path="/trainer/batches" element={<TrainerBatches />} />
                <Route path="/trainer/projects" element={<TrainerProjects />} />
                <Route path="/trainer/quizzes" element={<TrainerQuizzes />} />
              </Route>

              {/* Center Admin */}
              <Route element={<ProtectedRoute roles={["center_admin"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/center" element={<CenterDashboard />} />
                <Route path="/center/batches" element={<CenterBatches />} />
                <Route path="/center/students" element={<CenterStudents />} />
                <Route path="/center/trainers" element={<CenterTrainers />} />
                <Route path="/center/courses" element={<CenterCourses />} />
                <Route path="/center/attendance" element={<CenterAttendance />} />
                <Route path="/center/analytics" element={<CenterAnalytics />} />
              </Route>

              {/* Super Admin */}
              <Route element={<ProtectedRoute roles={["super_admin"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/centers" element={<AdminCenters />} />
                <Route path="/admin/licenses" element={<AdminLicenses />} />
                <Route path="/admin/courses" element={<AdminCourses />} />
                <Route path="/admin/trainers" element={<AdminTrainers />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
