import React, { useState } from "react";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading } from "@/components/common/States";
import { StudentTable } from "@/pages/trainer/TrainerDashboard";
import StudentDetailModal from "@/components/common/StudentDetailModal";

export default function TrainerStudents() {
  const { data, loading } = useFetch("/analytics/trainer");
  const [selected, setSelected] = useState(null);
  if (loading || !data) return <Loading />;
  return (
    <Page title="My Students" subtitle="All students across your batches.">
      <StudentTable students={data.students} onSelect={setSelected} />
      {selected && <StudentDetailModal studentId={selected.student_id} name={selected.name} onClose={() => setSelected(null)} />}
    </Page>
  );
}
