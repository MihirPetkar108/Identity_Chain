import { NextResponse } from 'next/server';
import { demoGenerator } from '@/lib/demo/generator';
import { activityAggregator } from '@/lib/analysis/activity-aggregator';
import { mlAnalysisService } from '@/lib/analysis/ml-service';

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === 'normal') {
      const res = await demoGenerator.generateNormalActivity();
      const features = activityAggregator.getFeaturesForActor(res.actor);
      const assessment = mlAnalysisService.assessActorRisk(features);
      return NextResponse.json({
        success: true,
        scenario: 'normal',
        result: res,
        assessment,
      });
    } else if (action === 'suspicious') {
      const res = await demoGenerator.generateSuspiciousActivity();
      const features = activityAggregator.getFeaturesForActor(res.actor);
      const assessment = mlAnalysisService.assessActorRisk(features);
      return NextResponse.json({
        success: true,
        scenario: 'suspicious',
        result: res,
        assessment,
      });
    } else if (action === 'reset') {
      demoGenerator.resetAll();
      return NextResponse.json({
        success: true,
        scenario: 'reset',
        message: 'All activity events and state reset successfully',
      });
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be "normal", "suspicious", or "reset"' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Demo generator failed' }, { status: 500 });
  }
}
