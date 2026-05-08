import { getGreeting } from "../lib/client-utils";

type WelcomeHeroProps = {
  name: string;
};

export function WelcomeHero({ name }: WelcomeHeroProps) {
  return (
    <section className="hero">
      <span className="eyebrow">
        {getGreeting()}, {name.split(" ")[0] || "there"}
      </span>
      <h1>What are you studying today?</h1>
    </section>
  );
}
