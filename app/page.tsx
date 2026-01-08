import Navbar from "@/components/nav";
import Header from "@/components/header";

export default function Home() {
  return (
    <>
      <div className="w-full max-w-xl mx-auto p-6 sm:p-3 min-h-screen flex flex-col">
        <Navbar />
        <Header />
      </div>
    </>
  );
}
