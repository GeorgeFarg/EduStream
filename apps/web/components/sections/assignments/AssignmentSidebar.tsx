interface Props {
  filter: string;
  setFilter: (val: string) => void;
}

export default function AssignmentSidebar({
  filter,
  setFilter,
}: Props) {

  const filters = ["all", "pending", "submitted", "missing"];

  return (
    <div className="w-44 space-y-2">

      {filters.map((f) => (

        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`w-full text-left px-4 py-2 rounded-xl transition
          ${
            filter === f
              ? "bg-blue-600 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
          }`}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>

      ))}

    </div>
  );
}

