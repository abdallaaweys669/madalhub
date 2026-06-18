import { computePublishEligibility } from './publish-eligibility.helper';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';

describe('computePublishEligibility', () => {
  const approvedProfile = {
    verificationStatus: 'approved',
    freePublishUsed: false,
    paidPublishCredits: 0,
  } as OrganizerProfile;

  it('blocks unverified organizers', () => {
    const result = computePublishEligibility({
      ...approvedProfile,
      verificationStatus: 'unverified',
    });
    expect(result.canPublish).toBe(false);
    expect(result.blockCode).toBe('VERIFICATION_REQUIRED');
  });

  it('allows first free publish after approval', () => {
    const result = computePublishEligibility(approvedProfile);
    expect(result.canPublish).toBe(true);
    expect(result.freePublishAvailable).toBe(true);
  });

  it('requires payment after free publish is used', () => {
    const result = computePublishEligibility({
      ...approvedProfile,
      freePublishUsed: true,
      paidPublishCredits: 0,
    });
    expect(result.canPublish).toBe(false);
    expect(result.blockCode).toBe('PAYMENT_REQUIRED');
  });

  it('allows publish when paid credits remain', () => {
    const result = computePublishEligibility({
      ...approvedProfile,
      freePublishUsed: true,
      paidPublishCredits: 3,
    });
    expect(result.canPublish).toBe(true);
  });
});
