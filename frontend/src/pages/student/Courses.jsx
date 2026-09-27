import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Layers, ArrowRight } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { Page } from "@/components/common/Page";
import { Loading, EmptyState } from "@/components/common/States";

const CATEGORY_COLORS = {
  coding: "bg-blue-500/10 text-blue-600",
  game: "bg-fuchsia-500/10 text-fuchsia-600",
  robotics: "bg-teal-500/10 text-teal-600",
  ai: "bg-amber-500/10 text-amber-600",
};

export default function Courses() {
  const navigate = useNavigate();
  const { data: courses, loading } = useFetch("/courses");
  if (loading) return <Loading />;

  return (
    <Page title="My Courses" subtitle="Interactive courses assigned to your batch.">
      {!courses || courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" description="Your trainer will assign courses to your batch soon." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="courses-grid">
          {courses.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/student/courses/${c.id}`)}
              data-testid={`course-card-${c.category}`}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-36 overflow-hidden">
                <img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${CATEGORY_COLORS[c.category] || "bg-primary/10 text-primary"}`}>
                  {c.category}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-heading text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {c.module_count} modules</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {c.lesson_count} lessons</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.duration}</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  Start learning <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
