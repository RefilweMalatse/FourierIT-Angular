import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** yyyy-mm-dd in local calendar (for `<input type="date">` min/max). */
export function formatIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * SA mobile: national number is 9 digits (6/7/8…) or 10 with leading 0.
 * Counts only digits; optional +27 is normalized to 0-prefixed national form.
 * Enforces at most 10 national digits after normalization.
 */
function validateSaMobileDigitsNonEmpty(raw: string): ValidationErrors | null {
  let digits = raw.replace(/\D/g, '');

  if (digits.length === 0) {
    return { phoneInvalid: true };
  }

  if (digits.startsWith('27') && digits.length >= 11) {
    digits = `0${digits.slice(2)}`;
  }

  if (digits.length > 10) {
    return { phoneTooManyDigits: true };
  }

  if (digits.length < 9) {
    return { phoneTooShort: true };
  }

  const national =
    digits.length === 10 && digits.startsWith('0')
      ? digits
      : digits.length === 9
        ? digits
        : null;

  if (!national) {
    return { phoneInvalid: true };
  }

  const ok10 = /^0[6-8]\d{8}$/.test(national);
  const ok9 = /^[6-8]\d{8}$/.test(national);
  if (!ok10 && !ok9) {
    return { phoneInvalid: true };
  }

  return null;
}

/** Required SA-style mobile (max 10 national digits). */
export function saMobilePhoneRequired(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) return { required: true };
    return validateSaMobileDigitsNonEmpty(raw);
  };
}

/** When empty: valid. Otherwise same rules as {@link saMobilePhoneRequired}. */
export function saMobilePhoneOptional(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) return null;
    return validateSaMobileDigitsNonEmpty(raw);
  };
}

const MAX_AGE_YEARS = 120;

/** Parses yyyy-mm-dd as local calendar date; invalid strings yield null. */
function parseIsoDateLocal(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

/** Not in the future; not more than {@link MAX_AGE_YEARS} years ago. */
export function birthDateReasonable(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v == null || String(v).trim() === '') {
      return null;
    }

    const birth = parseIsoDateLocal(String(v));
    if (!birth) {
      return { birthDateInvalid: true };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (birth > today) {
      return { birthDateFuture: true };
    }

    const oldest = new Date();
    oldest.setFullYear(oldest.getFullYear() - MAX_AGE_YEARS);
    oldest.setHours(0, 0, 0, 0);

    if (birth < oldest) {
      return { birthDateTooOld: true };
    }

    return null;
  };
}
