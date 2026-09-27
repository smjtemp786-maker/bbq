import React from "react";
import UserManager from "@/components/common/UserManager";

export default function CenterStudents() {
  return <UserManager role="student" title="Students" subtitle="Enroll and manage students at your center." centerScoped />;
}
