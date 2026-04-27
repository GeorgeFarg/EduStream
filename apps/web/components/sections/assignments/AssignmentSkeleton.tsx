// components/sections/assignments/AssignmentSkeleton.tsx

export default function AssignmentSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-5 animate-pulse"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/3" />
              <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded w-2/3" />
            </div>
            <div className="h-6 w-16 bg-gray-100 dark:bg-neutral-800 rounded-full" />
          </div>
          <div className="mt-4 h-3 bg-gray-100 dark:bg-neutral-800 rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}