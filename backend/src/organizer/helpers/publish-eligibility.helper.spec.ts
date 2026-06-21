import { computePublishEligibility } from './publish-eligibility.helper';

describe('computePublishEligibility', () => {
  const approvedProfile = {
    verificationStatus: 'approved',
    paidPublishCredits: 0,
  } as any;

  it('blocks unverified organizers', () => {
    const result = computePublishEligibility({
      verificationStatus: 'unverified',
      paidPublishCredits: 0,
    } as any);
    expect(result.blockCode).toBe('VERIFICATION_REQUIRED');
  });

  it('requires credits after approval when none remain', () => {
    const result = computePublishEligibility({
      ...approvedProfile,
      paidPublishCredits: 0,
    });
    expect(result.blockCode).toBe('CREDITS_REQUIRED');
  });

  it('allows publish when paid credits remain', () => {
    const result = computePublishEligibility({
      ...approvedProfile,
      paidPublishCredits: 3,
    });
    expect(result.canPublish).toBe(true);
    expect(result.blockCode).toBeNull();
  });
});
