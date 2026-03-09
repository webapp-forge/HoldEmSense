import Sidebar from "../../components/train/Sidebar";

export default function TrainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
