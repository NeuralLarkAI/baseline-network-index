export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-900 mt-24">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="text-xs text-neutral-600">
          Baseline provides infrastructure context. Not financial advice.
        </div>

        <div className="flex gap-6 text-xs text-neutral-600">
          <a className="hover:text-neutral-300 transition" href="#">
            Documentation
          </a>
          <a className="hover:text-neutral-300 transition" href="#">
            Status
          </a>
          <a className="hover:text-neutral-300 transition" href="#">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
