import { describe, expect, it } from 'vitest';
import { analyzeLeadComment } from './leadAnalysis';

describe('analyzeLeadComment', () => {
  it('classifies billing-company process descriptions as not fit', () => {
    const result = analyzeLeadComment(
      'We do entire billing and entering payments into the system for whole month and then export the payment report at the end of the month and reconcile.'
    );

    expect(result.stage).toBe('not_fit');
    expect(result.leadType).toBe('billing_vendor');
    expect(result.intent).toBe('vendor_process');
  });

  it('classifies sales/outreach replies as not fit', () => {
    const result = analyzeLeadComment(
      'Send me text. I will let you know all the process and share you information how it works.'
    );

    expect(result.stage).toBe('not_fit');
    expect(result.leadType).toBe('billing_vendor');
    expect(result.intent).toBe('vendor_process');
  });

  it('classifies own-practice billing pain as warm', () => {
    const result = analyzeLeadComment(
      'I do my own billing in SimplePractice and my claims keep getting stuck. I cannot keep up with reconciliation.'
    );

    expect(result.stage).toBe('warm');
    expect(result.leadType).toBe('potential_practice');
    expect(result.intent).toBe('billing_pain');
  });

  it('classifies own billing without pain as engaged, not warm', () => {
    const result = analyzeLeadComment('I do my own billing in SimplePractice and reconcile every Friday.');

    expect(result.stage).toBe('engaged');
    expect(result.leadType).toBe('potential_practice');
    expect(result.intent).toBe('own_billing_no_pain');
  });

  it('classifies workflow advice as process advice, not pain', () => {
    const result = analyzeLeadComment(
      'Most people develop a monthly reconciliation system. Compare claims submitted against claims paid, match ERA/EOB to bank deposits, and review aging reports.'
    );

    expect(result.stage).toBe('engaged');
    expect(result.leadType).toBe('process_advice');
    expect(result.intent).toBe('process_advice');
  });

  it('classifies outsourced platform users as not fit', () => {
    const result = analyzeLeadComment('Alma handles my billing, so I never really touch claims.');

    expect(result.stage).toBe('not_fit');
    expect(result.leadType).toBe('outsourced_billing');
  });

  it('classifies questions without pain as engaged', () => {
    const result = analyzeLeadComment('Does anyone know whether SimplePractice has a report for this?');

    expect(result.stage).toBe('engaged');
    expect(result.intent).toBe('question');
  });
});
