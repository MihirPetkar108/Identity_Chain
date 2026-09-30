import { NextResponse } from 'next/server';
import { activityAggregator } from '@/lib/analysis/activity-aggregator';
import { mlAnalysisService } from '@/lib/analysis/ml-service';
import { DEMO_ACTORS } from '@/lib/constants';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let actor = searchParams.get('actor');

  const allActors = activityAggregator.getAllActors();

  if (!actor) {
    if (allActors.length > 0) {
      actor = allActors[0];
    } else {
      actor = DEMO_ACTORS.SUSPICIOUS_ACTOR;
    }
  }

  const features = activityAggregator.getFeaturesForActor(actor);
  const assessment = mlAnalysisService.assessActorRisk(features);

  return NextResponse.json({
    actor,
    availableActors: allActors.length > 0 ? allActors : [DEMO_ACTORS.SUSPICIOUS_ACTOR, DEMO_ACTORS.NORMAL_USER],
    assessment,
  });
}
