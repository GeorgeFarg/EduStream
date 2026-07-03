'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface CourseSelectorProps {
  courses: Course[];
  currentCourse: Course;
  onSelectCourse: (course: Course) => void;
  onNewCourse?: () => void;
}

export function CourseSelector({
  courses,
  currentCourse,
  onSelectCourse,
  onNewCourse,
}: CourseSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-4 py-2 h-auto mb-2"
        >
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Current Course</p>
            <p className="font-semibold text-sm">{currentCourse.name}</p>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>My Courses</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {courses.map((course) => (
          <DropdownMenuItem
            key={course.id}
            onClick={() => onSelectCourse(course)}
            className={currentCourse.id === course.id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <p className="font-semibold">{course.name}</p>
              <p className="text-xs text-muted-foreground">{course.code}</p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNewCourse} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Course
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
