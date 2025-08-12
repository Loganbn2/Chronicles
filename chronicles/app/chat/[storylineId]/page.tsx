import Chat from "@/components/Chat";
import { storylines } from "@/lib/storylines";
import Link from "next/link";

export default async function ChatPage({ params }: { params: Promise<{ storylineId: string }> }) {
  const { storylineId } = await params;
  const storyline = storylines.find((x) => x.id === storylineId);
  
  if (!storyline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-parchment via-parchment-dark to-ivory flex items-center justify-center">
        <div className="card animate-fade-in max-w-md mx-4 text-center">
          <div className="text-6xl mb-6">📜</div>
          <h2 className="font-display text-2xl font-bold text-ink mb-4">
            Chronicle Not Found
          </h2>
          <p className="font-garamond text-bronze mb-6 leading-relaxed">
            The requested historical narrative could not be located in our archives. 
            Perhaps it was lost to the sands of time...
          </p>
          <Link href="/" className="button">
            ← Return to the Library
          </Link>
        </div>
      </div>
    );
  }

  return <Chat initialStorylineId={storyline.id} hideStorylinePicker />;
}
