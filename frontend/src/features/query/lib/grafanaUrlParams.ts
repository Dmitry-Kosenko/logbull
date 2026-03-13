import dayjs, { type Dayjs, type ManipulateType, type OpUnitType } from 'dayjs';

import type { QueryNode } from '../../../entity/query';

type SortOrder = 'asc' | 'desc';

interface GrafanaTimeRange {
  from: Dayjs;
  to: Dayjs;
}

export interface GrafanaQueryBootstrap {
  query: QueryNode | null;
  timeRange: GrafanaTimeRange | null;
  sortOrder?: SortOrder;
  limit?: number;
  autoExecute: boolean;
}

export interface GrafanaUrlState {
  hasGrafanaParams: boolean;
  projectId?: string;
  bootstrap?: GrafanaQueryBootstrap;
  errors: string[];
}

const CONDITION_OPERATORS = new Set([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'in',
  'not_in',
  'greater_than',
  'greater_or_equal',
  'less_than',
  'less_or_equal',
  'exists',
  'not_exists',
]);

const LOGICAL_OPERATORS = new Set(['and', 'or', 'not']);

const ROUNDING_UNITS = new Map<string, OpUnitType>([
  ['s', 'second'],
  ['m', 'minute'],
  ['h', 'hour'],
  ['d', 'day'],
  ['w', 'week'],
  ['M', 'month'],
  ['y', 'year'],
]);

const OFFSET_UNITS = new Map<string, ManipulateType>([
  ['ms', 'millisecond'],
  ['s', 'second'],
  ['m', 'minute'],
  ['h', 'hour'],
  ['d', 'day'],
  ['w', 'week'],
  ['M', 'month'],
  ['y', 'year'],
]);

const BLOCKING_ERROR_PREFIXES = ['Invalid Grafana query filter', 'Invalid Grafana time range'];

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isConditionValue = (value: unknown): boolean => {
  if (value === null) {
    return true;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const isConditionNode = (value: unknown): boolean => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.field === 'string' &&
    CONDITION_OPERATORS.has(String(value.operator)) &&
    isConditionValue(value.value)
  );
};

const isQueryNode = (value: unknown): value is QueryNode => {
  if (!isPlainObject(value) || typeof value.type !== 'string') {
    return false;
  }

  if (value.type === 'condition') {
    return isConditionNode(value.condition);
  }

  if (value.type === 'logical') {
    if (!isPlainObject(value.logic)) {
      return false;
    }

    if (!LOGICAL_OPERATORS.has(String(value.logic.operator)) || !Array.isArray(value.logic.children)) {
      return false;
    }

    return value.logic.children.every(isQueryNode);
  }

  return false;
};

const parseNumericTimestamp = (rawValue: string): Dayjs | null => {
  if (!/^-?\d+$/.test(rawValue)) {
    return null;
  }

  const parsedNumber = Number(rawValue);
  if (Number.isNaN(parsedNumber)) {
    return null;
  }

  return Math.abs(parsedNumber) >= 1e12 ? dayjs(parsedNumber) : dayjs.unix(parsedNumber);
};

const parseRelativeTimestamp = (rawValue: string): Dayjs | null => {
  const trimmedValue = rawValue.trim();
  if (trimmedValue === 'now') {
    return dayjs();
  }

  const match = trimmedValue.match(
    /^now(?:(?<sign>[+-])(?<amount>\d+)(?<unit>ms|s|m|h|d|w|M|y))?(?:\/(?<round>s|m|h|d|w|M|y))?$/,
  );
  if (!match?.groups) {
    return null;
  }

  let result = dayjs();

  const { sign, amount, unit, round } = match.groups;
  if (sign && amount && unit) {
    const dayjsUnit = OFFSET_UNITS.get(unit);
    if (!dayjsUnit) {
      return null;
    }

    const numericAmount = Number(amount);
    result =
      sign === '-'
        ? result.subtract(numericAmount, dayjsUnit)
        : result.add(numericAmount, dayjsUnit);
  }

  if (round) {
    const roundUnit = ROUNDING_UNITS.get(round);
    if (!roundUnit) {
      return null;
    }

    result = result.startOf(roundUnit);
  }

  return result;
};

const parseGrafanaTimestamp = (rawValue: string): Dayjs | null => {
  const numericTimestamp = parseNumericTimestamp(rawValue);
  if (numericTimestamp?.isValid()) {
    return numericTimestamp;
  }

  const directTimestamp = dayjs(rawValue);
  if (directTimestamp.isValid()) {
    return directTimestamp;
  }

  const relativeTimestamp = parseRelativeTimestamp(rawValue);
  if (relativeTimestamp?.isValid()) {
    return relativeTimestamp;
  }

  return null;
};

const hasBlockingErrors = (errors: string[]): boolean => {
  return errors.some((error) =>
    BLOCKING_ERROR_PREFIXES.some((blockingPrefix) => error.startsWith(blockingPrefix)),
  );
};

export const parseGrafanaUrlState = (search: string): GrafanaUrlState => {
  const searchParams = new URLSearchParams(search);
  const projectId = searchParams.get('var-project')?.trim() || undefined;
  const queryParam = searchParams.get('var-query');
  const sortOrderParam = searchParams.get('var-sortOrder')?.trim().toLowerCase();
  const limitParam = searchParams.get('var-limit')?.trim();
  const fromParam = searchParams.get('from')?.trim();
  const toParam = searchParams.get('to')?.trim();
  const errors: string[] = [];

  const hasGrafanaParams =
    Boolean(projectId) ||
    queryParam !== null ||
    Boolean(sortOrderParam) ||
    Boolean(limitParam) ||
    Boolean(fromParam) ||
    Boolean(toParam);

  if (!hasGrafanaParams) {
    return {
      hasGrafanaParams: false,
      errors: [],
    };
  }

  let query: QueryNode | null = null;
  if (queryParam !== null && queryParam.trim() !== '') {
    try {
      const parsedQuery = JSON.parse(queryParam) as unknown;
      if (parsedQuery !== null && !isQueryNode(parsedQuery)) {
        throw new Error('invalid query node structure');
      }

      query = parsedQuery as QueryNode | null;
    } catch {
      errors.push('Invalid Grafana query filter: expected URL-encoded JSON QueryNode.');
    }
  }

  let sortOrder: SortOrder | undefined;
  if (sortOrderParam) {
    if (sortOrderParam === 'asc' || sortOrderParam === 'desc') {
      sortOrder = sortOrderParam;
    } else {
      errors.push('Invalid Grafana sort order: expected "asc" or "desc".');
    }
  }

  let limit: number | undefined;
  if (limitParam) {
    const parsedLimit = Number(limitParam);
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      limit = parsedLimit;
    } else {
      errors.push('Invalid Grafana limit: expected a positive integer.');
    }
  }

  let timeRange: GrafanaTimeRange | null = null;
  if (fromParam || toParam) {
    if (!fromParam || !toParam) {
      errors.push('Invalid Grafana time range: both "from" and "to" must be provided.');
    } else {
      const from = parseGrafanaTimestamp(fromParam);
      const to = parseGrafanaTimestamp(toParam);

      if (!from || !to) {
        errors.push('Invalid Grafana time range: unsupported "from" or "to" value.');
      } else if (from.isAfter(to)) {
        errors.push('Invalid Grafana time range: "from" must be earlier than or equal to "to".');
      } else {
        timeRange = { from, to };
      }
    }
  }

  return {
    hasGrafanaParams: true,
    projectId,
    bootstrap: {
      query,
      timeRange,
      sortOrder,
      limit,
      autoExecute: !hasBlockingErrors(errors),
    },
    errors,
  };
};
