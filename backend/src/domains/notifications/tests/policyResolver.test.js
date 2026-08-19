const policyResolver = require('../services/policyResolver.service');
const configService = require('../../../core/config/config.service');
const communicationRegistryService = require('../services/communicationRegistry.service');

// Mock dependencies
jest.mock('../../../core/config/config.service');
jest.mock('../services/communicationRegistry.service');

describe('PolicyResolver V2 - Enterprise Policy Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {};
  });

  it('should use Registry Rule when available and generate a Communication Plan', async () => {
    configService.get.mockResolvedValue('true');
    communicationRegistryService.getRule.mockResolvedValue({
      eventName: 'ORDER_CREATED',
      channels: ['WHATSAPP', 'EMAIL'],
      providerPriority: ['META', 'SMTP']
    });

    const payload = { phone: '1234567890', correlationId: 'abc' };
    const result = await policyResolver.resolve('ORDER_CREATED', payload);

    expect(result.allowed).toBe(true);
    // Backward compatibility guarantee
    expect(result.channels).toEqual(['WHATSAPP', 'EMAIL']);
    
    // New Enterprise Contract
    expect(result.plan).toBeDefined();
    expect(result.plan.channels).toHaveLength(2);
    expect(result.plan.channels[0].channel).toBe('WHATSAPP');
    expect(result.plan.channels[0].provider).toBe('META');
    expect(result.plan.source).toBe('registry');
  });

  it('should fallback to legacy logic when Registry misses', async () => {
    configService.get.mockResolvedValue('true');
    communicationRegistryService.getRule.mockResolvedValue(null);
    process.env.ENABLE_WHATSAPP_NOTIFICATIONS = 'true';

    const payload = { phone: '1234567890' };
    const result = await policyResolver.resolve('UNKNOWN_EVENT', payload);

    expect(result.allowed).toBe(true);
    expect(result.channels).toEqual(['WHATSAPP']);
    expect(result.plan).toBeUndefined(); // Legacy mode
  });

  it('should fallback to legacy logic if Registry or Config throws an error', async () => {
    configService.get.mockRejectedValue(new Error('Redis Timeout'));
    process.env.ENABLE_WHATSAPP_NOTIFICATIONS = 'true';

    const payload = { phone: '1234567890' };
    const result = await policyResolver.resolve('ORDER_CREATED', payload);

    expect(result.allowed).toBe(true);
    expect(result.channels).toEqual(['WHATSAPP']);
    expect(result.plan).toBeUndefined();
  });

  it('should skip communication if Global Feature Flag is disabled', async () => {
    configService.get.mockResolvedValue('false'); // COMMUNICATION_ENABLED = false
    
    const payload = { phone: '1234567890' };
    const result = await policyResolver.resolve('ORDER_CREATED', payload);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('disabled via feature flag');
  });

  it('should skip communication if no phone number is provided (legacy behavior preserved)', async () => {
    configService.get.mockResolvedValue('true');
    communicationRegistryService.getRule.mockResolvedValue(null);

    const payload = {}; // No phone
    const result = await policyResolver.resolve('ORDER_CREATED', payload);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No recipient phone number found');
  });
});
