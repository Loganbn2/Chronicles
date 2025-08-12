import Link from "next/link";
import { storylines } from "@/lib/storylines";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment via-parchment-dark to-ivory">
      {/* Majestic Header with Ornamental Design */}
      <header className="relative border-b-4 border-gold shadow-2xl" style={{
        background: `
          linear-gradient(135deg, var(--ivory) 0%, var(--parchment) 30%, var(--parchment-dark) 70%, var(--ivory) 100%),
          repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(218, 165, 32, 0.1) 100px, rgba(218, 165, 32, 0.1) 102px)
        `,
      }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Logo Section with Enhanced Ornament */}
            <div className="flex items-center gap-6">
              <div className="header-ornament animate-glow"></div>
              <div>
                <h1 className="font-display text-5xl font-bold text-ink leading-none tracking-wide">
                  Chronicles
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-0.5 w-8 bg-gradient-to-r from-gold to-bronze"></div>
                  <p className="font-garamond text-lg text-bronze italic">
                    Immersive Historical Roleplay
                  </p>
                  <div className="h-0.5 w-8 bg-gradient-to-r from-bronze to-gold"></div>
                </div>
              </div>
            </div>

            {/* Navigation with Status Badges */}
            <nav className="flex items-center gap-4">
              <div className="badge">PG-13 Rated</div>
              <div className="badge-secondary">Safety Tools</div>
              <div className="badge-success">AI Powered</div>
            </nav>
          </div>
        </div>

        {/* Decorative Border Pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-bronze/10 pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-ink mb-6 leading-tight">
              Step Into the 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-bronze to-gold">
                {" "}Annals of History
              </span>
            </h2>
            
            <p className="font-garamond text-xl md:text-2xl text-ink-light max-w-4xl mx-auto leading-relaxed mb-12">
              Craft your character, engage with legendary figures, and shape the course of civilizations 
              through immersive roleplay experiences across the greatest eras in human history.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/chat" className="button text-lg px-8 py-4">
                Begin Your Journey
              </Link>
              <div className="flex items-center gap-2 text-bronze font-display text-sm uppercase tracking-wider">
                <span>⚔</span>
                <span>Choose Your Era Below</span>
                <span>⚔</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Storylines Gallery */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="divider">
              <span>Historical Adventures</span>
            </div>
            <h3 className="font-display text-3xl font-bold text-ink mt-8 mb-4">
              Choose Your Historical Adventure
            </h3>
            <p className="font-garamond text-lg text-ink-light max-w-2xl mx-auto">
              Each storyline offers a unique journey through history, complete with authentic characters,
              settings, and challenges of the era.
            </p>
          </div>

          {/* Enhanced Storyline Grid */}
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {storylines.map((storyline, index) => (
              <Link 
                key={storyline.id} 
                href={`/chat/${storyline.id}`}
                className="card ornate-corners group animate-fade-in hover:scale-105 transition-all duration-500"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Era Badge */}
                <div className="absolute top-6 right-6 badge text-xs">
                  {storyline.location?.split(',')[0] || 'Historical'}
                </div>

                {/* Main Content */}
                <div className="space-y-4">
                  {/* Era and Title */}
                  <div>
                    <p className="font-garamond text-sm text-bronze italic mb-2">
                      {storyline.era}
                    </p>
                    <h4 className="font-display text-2xl font-bold text-ink leading-tight mb-3">
                      {storyline.title}
                    </h4>
                    <p className="font-serif text-ink-light leading-relaxed">
                      {storyline.description}
                    </p>
                  </div>

                  {/* Characters Preview */}
                  {storyline.characters.length > 0 && (
                    <div>
                      <h5 className="font-display text-xs font-semibold text-bronze uppercase tracking-wider mb-3">
                        Meet Historical Figures
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {storyline.characters.slice(0, 4).map((character) => (
                          <span key={character.id} className="badge-secondary text-xs">
                            {character.name}
                          </span>
                        ))}
                        {storyline.characters.length > 4 && (
                          <span className="badge-secondary text-xs opacity-70">
                            +{storyline.characters.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Starter Hook Preview */}
                  {storyline.starterHook && (
                    <div className="pt-2 border-t border-gold/20">
                      <p className="font-garamond text-sm text-bronze italic leading-relaxed">
                        "{storyline.starterHook.length > 120 
                          ? storyline.starterHook.substring(0, 120) + "..." 
                          : storyline.starterHook}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t border-gold/20">
                  <div className="button w-full text-center group-hover:bg-gradient-to-r group-hover:from-gold-light group-hover:to-bronze-light transition-all duration-300">
                    Enter This Era
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-gold/5 via-transparent to-bronze/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="divider">
              <span>Features</span>
            </div>
            <h3 className="font-display text-3xl font-bold text-ink mt-8">
              Immersive Historical Experience
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center animate-fade-in">
              <div className="text-4xl mb-4">🎭</div>
              <h4 className="font-display text-xl font-semibold text-ink mb-3">Character Creation</h4>
              <p className="font-serif text-ink-light">
                Craft unique characters with detailed backgrounds, skills, and motivations authentic to your chosen era.
              </p>
            </div>

            <div className="card text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl mb-4">🏛️</div>
              <h4 className="font-display text-xl font-semibold text-ink mb-3">Historical Accuracy</h4>
              <p className="font-serif text-ink-light">
                Engage with historically accurate settings, characters, and events crafted by historians.
              </p>
            </div>

            <div className="card text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-4xl mb-4">🤖</div>
              <h4 className="font-display text-xl font-semibold text-ink mb-3">AI Storytelling</h4>
              <p className="font-serif text-ink-light">
                Experience dynamic narratives powered by advanced AI that adapts to your choices and actions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-gold bg-gradient-to-r from-parchment via-parchment-dark to-parchment py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="header-ornament mx-auto mb-6"></div>
          <p className="font-display text-bronze text-sm uppercase tracking-widest">
            ⚜ Crafted for Historical Immersion ⚜
          </p>
          <p className="font-garamond text-ink-light mt-2">
            Step into history. Shape the narrative. Become legendary.
          </p>
        </div>
      </footer>
    </div>
  );
}
