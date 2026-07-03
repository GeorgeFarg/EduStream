const MainButton = ({ text }: { text: string }) => {
  return (
    <button className="inline-flex h-11 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">
      {text}
    </button>
  );
};

export default MainButton;
