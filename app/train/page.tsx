import { auth } from "../../lib/auth";
import { getSkillTreeProgress, getCompletedModules, getSkillCardProgress } from "../../lib/actions/skillTree";
import SkillCardGrid from "../../components/train/SkillCardGrid";
import type { Role } from "../../components/train/trainNavConfig";

export default async function TrainPage() {
  const [session, progress, completedModules, cardProgress] = await Promise.all([
    auth(),
    getSkillTreeProgress(),
    getCompletedModules(),
    getSkillCardProgress(),
  ]);

  const role: Role = !session
    ? "guest"
    : (session.user as any).isPremium
    ? "premium"
    : "registered";

  return <SkillCardGrid role={role} progress={progress} completedModules={completedModules} cardProgress={cardProgress} />;
}
