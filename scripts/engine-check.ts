import { sampleEntries } from "@/lib/crm/samples";
import { buildHypothesis, buildRefinement, rankPool, explainRef } from "@/lib/agent/engine";
for (const e of sampleEntries()) {
  const p = e.project; const a = p.answers;
  const h = buildHypothesis(a); const r = buildRefinement(a);
  console.log("\n==", e.id, "step", p.currentStep, "/", p.maxStep, "hyp", h?.id, a.hypothesis?.id, "ref", r?.id, a.refinement?.choice);
  const tp = p.snapshot!.tasteProfile;
  console.log(" dir:", tp.primary?.name, "|", tp.secondary?.name, "| words:", tp.atmosphereWords.join(","));
  console.log(" pref:", tp.preferred.map(t=>`${t.tag}:${t.score}${t.confidence==='visible'?'*':''}`).join(" "));
  console.log(" avoid:", tp.avoided.map(t=>`${t.tag}:${t.score}`).join(" "), "contr:", tp.contradiction);
  console.log(" mood:", p.snapshot!.moodboard.items.map(i=>i.refId+"("+i.origin+")").join(" "));
  console.log(" brief Qs:", p.snapshot!.brief?.openQuestions.length, p.snapshot!.brief?.goal);
  const top = rankPool(a).slice(0,3); console.log(" next:", top.map(x=>x.ref.id+":"+x.score.toFixed(1)).join(" "));
  console.log(" why:", explainRef(top[0].ref, a));
}
