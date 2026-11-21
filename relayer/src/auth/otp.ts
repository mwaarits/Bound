export interface OTPProvider {
  requestOTP(wa: string): void;
  verifyOTP(wa: string, code: string): Promise<boolean>;
}

export class MockOTPProvider implements OTPProvider {
  private pending = new Map<string, void>();

  requestOTP(wa: string): void {
    this.pending.set(wa, undefined);
  }

  verifyOTP(wa: string, code: string): Promise<boolean> {
    if (!this.pending.has(wa)) {
      return Promise.reject(Object.assign(new Error('WA not registered'), { statusCode: 404 }));
    }
    return Promise.resolve(code === '123456');
  }
}

export const otp = new MockOTPProvider();
