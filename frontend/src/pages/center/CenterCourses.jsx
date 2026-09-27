import React from "react";
import { BookOpen, Layers, Clock } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";

export default function CenterCourses() {
  const { data: courses, loading } = useFetch("/courses");
  if (loading) return <Loading />;
  return (
    <Page title="Courses" subtitle="Courses available to assign to your batches.">
      {!courses || courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <img src={c.thumbnail} alt={c.title} className="h-32 w-full object-cover" />
              <div className="p-5">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">{c.category}</span>
                <h3 className="mt-2 font-heading font-semibold">{c.title}</h3>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {c.module_count} modules</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {c.lesson_count} lessons</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
