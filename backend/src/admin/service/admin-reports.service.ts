import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerPaymentRequest } from 'src/database/entities/organizer-payment-request.entity';
import { OrganizerCreditRequest } from 'src/database/entities/organizer-credit-request.entity';
import { Event } from 'src/database/entities/event.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { Interest } from 'src/database/entities/interest.entity';
import {
  AdminReportSummaryQueryDto,
  ReportSummaryType,
} from '../dto/admin-report-summary-query.dto';

const MEMBER_ROLE_ID = 1;
const ORGANIZER_ROLE_ID = 2;
const ADMIN_ROLE_ID = 3;

type Kpi = { key: string; label: string; value: number | string };
type Breakdown = { label: string; value: number };

export type ReportSummaryResponse = {
  type: ReportSummaryType;
  from: string;
  to: string;
  kpis: Kpi[];
  trendMonths: string[];
  trendValues: number[];
  breakdown: Breakdown[];
  rows: Record<string, unknown>[];
  topCreators?: Record<string, unknown>[];
  exportType: string | null;
};

@Injectable()
export class AdminReportsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    @InjectRepository(OrganizerPaymentRequest)
    private paymentRequestRepository: Repository<OrganizerPaymentRequest>,
    @InjectRepository(OrganizerCreditRequest)
    private creditRequestRepository: Repository<OrganizerCreditRequest>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventRegistration)
    private registrationRepository: Repository<EventRegistration>,
    @InjectRepository(Interest)
    private interestRepository: Repository<Interest>,
  ) {}

  async getSummary(query: AdminReportSummaryQueryDto): Promise<ReportSummaryResponse> {
    const { fromDate, toDate } = this.parseRange(query.from, query.to);

    switch (query.type) {
      case 'user-growth':
        return this.userGrowthReport(fromDate, toDate);
      case 'organizers':
        return this.organizersReport(fromDate, toDate);
      case 'events':
        return this.eventsReport(fromDate, toDate);
      case 'registrations':
        return this.registrationsReport(fromDate, toDate);
      case 'attendance':
        return this.attendanceReport(fromDate, toDate);
      case 'revenue':
        return this.revenueReport(fromDate, toDate);
      case 'verification':
        return this.verificationReport(fromDate, toDate);
      case 'popular-events':
        return this.popularEventsReport(fromDate, toDate);
      case 'audience':
        return this.audienceReport(fromDate, toDate);
      case 'location':
        return this.locationReport(fromDate, toDate);
      case 'logs':
        return this.logsReport(fromDate, toDate);
      default:
        throw new BadRequestException('Unknown report type');
    }
  }

  private parseRange(from?: string, to?: string) {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const fromDate = from ? new Date(from) : defaultFrom;
    const toDate = to ? new Date(`${to}T23:59:59.999`) : now;

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    if (fromDate > toDate) {
      throw new BadRequestException('From date must be before to date');
    }

    return { fromDate, toDate };
  }

  private baseResponse(
    type: ReportSummaryType,
    fromDate: Date,
    toDate: Date,
    exportType: string | null,
  ): Pick<ReportSummaryResponse, 'type' | 'from' | 'to' | 'exportType'> {
    return {
      type,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      exportType,
    };
  }

  private async monthlyTrend(
    countFn: (start: Date, end: Date) => Promise<number>,
    fromDate: Date,
    toDate: Date,
  ) {
    const trendMonths: string[] = [];
    const trendValues: number[] = [];
    const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

    while (cursor <= end) {
      const mStart = new Date(cursor);
      const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
      const rangeStart = mStart < fromDate ? fromDate : mStart;
      const rangeEnd = mEnd > toDate ? toDate : mEnd;

      trendMonths.push(mStart.toLocaleString('default', { month: 'short' }));
      trendValues.push(await countFn(rangeStart, rangeEnd));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { trendMonths, trendValues };
  }

  private async userGrowthReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const [total, active, pending, newInRange, admins] = await Promise.all([
      this.userRepository.count({ where: { roleId: MEMBER_ROLE_ID } }),
      this.userRepository.count({ where: { roleId: MEMBER_ROLE_ID, status: 'active' } }),
      this.userRepository.count({ where: { roleId: MEMBER_ROLE_ID, status: 'pending' } }),
      this.userRepository
        .createQueryBuilder('u')
        .where('u.roleId = :r', { r: MEMBER_ROLE_ID })
        .andWhere('u.createdAt >= :from AND u.createdAt <= :to', { from: fromDate, to: toDate })
        .getCount(),
      this.userRepository.count({ where: { roleId: ADMIN_ROLE_ID } }),
    ]);

    const { trendMonths, trendValues } = await this.monthlyTrend(
      (start, end) =>
        this.userRepository
          .createQueryBuilder('u')
          .where('u.roleId = :r', { r: MEMBER_ROLE_ID })
          .andWhere('u.createdAt >= :s AND u.createdAt <= :e', { s: start, e: end })
          .getCount(),
      fromDate,
      toDate,
    );

    const statusRows = await this.userRepository
      .createQueryBuilder('u')
      .select('u.status', 'label')
      .addSelect('COUNT(*)', 'value')
      .where('u.roleId = :r', { r: MEMBER_ROLE_ID })
      .groupBy('u.status')
      .getRawMany<{ label: string; value: string }>();

    const recent = await this.userRepository
      .createQueryBuilder('u')
      .where('u.roleId = :r', { r: MEMBER_ROLE_ID })
      .andWhere('u.createdAt >= :from AND u.createdAt <= :to', { from: fromDate, to: toDate })
      .orderBy('u.createdAt', 'DESC')
      .take(25)
      .getMany();

    return {
      ...this.baseResponse('user-growth', fromDate, toDate, 'members'),
      kpis: [
        { key: 'total', label: 'Total members', value: total },
        { key: 'active', label: 'Active', value: active },
        { key: 'new', label: 'New in range', value: newInRange },
        { key: 'admins', label: 'Admins', value: admins },
      ],
      trendMonths,
      trendValues,
      breakdown: statusRows.map((r) => ({
        label: r.label || 'unknown',
        value: Number(r.value),
      })),
      rows: recent.map((u) => ({
        name: u.fullName,
        email: u.email,
        status: u.status,
        joined: u.createdAt,
      })),
    };
  }

  private async organizersReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const [total, newInRange, pending, approved] = await Promise.all([
      this.organizerProfileRepository.count(),
      this.organizerProfileRepository
        .createQueryBuilder('p')
        .where('p.createdAt >= :from AND p.createdAt <= :to', { from: fromDate, to: toDate })
        .getCount(),
      this.organizerProfileRepository.count({ where: { verificationStatus: 'pending' } }),
      this.organizerProfileRepository.count({ where: { verificationStatus: 'approved' } }),
    ]);

    const { trendMonths, trendValues } = await this.monthlyTrend(
      (start, end) =>
        this.organizerProfileRepository
          .createQueryBuilder('p')
          .where('p.createdAt >= :s AND p.createdAt <= :e', { s: start, e: end })
          .getCount(),
      fromDate,
      toDate,
    );

    const statusRows = await this.organizerProfileRepository
      .createQueryBuilder('p')
      .select('p.verificationStatus', 'label')
      .addSelect('COUNT(*)', 'value')
      .where('p.createdAt >= :from AND p.createdAt <= :to', { from: fromDate, to: toDate })
      .groupBy('p.verificationStatus')
      .getRawMany<{ label: string; value: string }>();

    const topRows = await this.eventRepository
      .createQueryBuilder('e')
      .select('e.organizerId', 'organizerId')
      .addSelect('COUNT(*)', 'eventCount')
      .where('e.createdAt >= :from AND e.createdAt <= :to', { from: fromDate, to: toDate })
      .groupBy('e.organizerId')
      .orderBy('eventCount', 'DESC')
      .take(15)
      .getRawMany<{ organizerId: string; eventCount: string }>();

    const rows = await Promise.all(
      topRows.map(async (row) => {
        const profile = await this.organizerProfileRepository.findOne({
          where: { userId: Number(row.organizerId) },
        });
        const user = await this.userRepository.findOne({
          where: { id: Number(row.organizerId) },
        });
        return {
          organization: profile?.organizationName ?? user?.fullName ?? 'Organizer',
          email: user?.email ?? '',
          events: Number(row.eventCount),
          status: profile?.verificationStatus ?? '',
        };
      }),
    );

    return {
      ...this.baseResponse('organizers', fromDate, toDate, 'organizers'),
      kpis: [
        { key: 'total', label: 'Total organizers', value: total },
        { key: 'new', label: 'New in range', value: newInRange },
        { key: 'pending', label: 'Pending review', value: pending },
        { key: 'approved', label: 'Approved', value: approved },
      ],
      trendMonths,
      trendValues,
      breakdown: statusRows.map((r) => ({
        label: r.label || 'unknown',
        value: Number(r.value),
      })),
      rows: [],
      topCreators: rows,
    };
  }

  private async eventsReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const [total, draft, published, cancelled, newInRange] = await Promise.all([
      this.eventRepository.count(),
      this.eventRepository.count({ where: { status: 'draft' } }),
      this.eventRepository.count({ where: { status: 'published' } }),
      this.eventRepository.count({ where: { status: 'cancelled' } }),
      this.eventRepository
        .createQueryBuilder('e')
        .where('e.createdAt >= :from AND e.createdAt <= :to', { from: fromDate, to: toDate })
        .getCount(),
    ]);

    const { trendMonths, trendValues } = await this.monthlyTrend(
      (start, end) =>
        this.eventRepository
          .createQueryBuilder('e')
          .where('e.createdAt >= :s AND e.createdAt <= :e', { s: start, e: end })
          .getCount(),
      fromDate,
      toDate,
    );

    const categoryRows = await this.eventRepository
      .createQueryBuilder('e')
      .leftJoin(Interest, 'i', 'i.id = e.interestId')
      .select('COALESCE(i.name, :unknown)', 'label')
      .addSelect('COUNT(*)', 'value')
      .where('e.createdAt >= :from AND e.createdAt <= :to', { from: fromDate, to: toDate })
      .setParameter('unknown', 'Uncategorized')
      .groupBy('i.name')
      .orderBy('value', 'DESC')
      .getRawMany<{ label: string; value: string }>();

    const recent = await this.eventRepository
      .createQueryBuilder('e')
      .where('e.createdAt >= :from AND e.createdAt <= :to', { from: fromDate, to: toDate })
      .orderBy('e.createdAt', 'DESC')
      .take(25)
      .getMany();

    return {
      ...this.baseResponse('events', fromDate, toDate, 'events'),
      kpis: [
        { key: 'total', label: 'Total events', value: total },
        { key: 'published', label: 'Published', value: published },
        { key: 'draft', label: 'Draft', value: draft },
        { key: 'new', label: 'New in range', value: newInRange },
      ],
      trendMonths,
      trendValues,
      breakdown: categoryRows.map((r) => ({ label: r.label, value: Number(r.value) })),
      rows: recent.map((e) => ({
        title: e.title,
        status: e.status,
        location: e.locationName,
        starts: e.startDatetime,
      })),
    };
  }

  private async registrationsReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const baseQb = () =>
      this.registrationRepository
        .createQueryBuilder('r')
        .where('r.createdAt >= :from AND r.createdAt <= :to', { from: fromDate, to: toDate });

    const [total, registered, checkedIn, attended, cancelled] = await Promise.all([
      baseQb().getCount(),
      baseQb().andWhere('r.status = :s', { s: 'registered' }).getCount(),
      baseQb().andWhere('r.status = :s', { s: 'checked_in' }).getCount(),
      baseQb().andWhere('r.status = :s', { s: 'attended' }).getCount(),
      baseQb().andWhere('r.status = :s', { s: 'cancelled' }).getCount(),
    ]);

    const { trendMonths, trendValues } = await this.monthlyTrend(
      (start, end) =>
        this.registrationRepository
          .createQueryBuilder('r')
          .where('r.createdAt >= :s AND r.createdAt <= :e', { s: start, e: end })
          .andWhere('r.status != :c', { c: 'cancelled' })
          .getCount(),
      fromDate,
      toDate,
    );

    const statusRows = await baseQb()
      .select('r.status', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('r.status')
      .getRawMany<{ label: string; value: string }>();

    const recent = await baseQb().orderBy('r.createdAt', 'DESC').take(25).getMany();

    const rows = await Promise.all(
      recent.map(async (r) => {
        const [member, event] = await Promise.all([
          this.userRepository.findOne({ where: { id: r.memberId } }),
          this.eventRepository.findOne({ where: { id: r.eventId } }),
        ]);
        return {
          event: event?.title ?? `#${r.eventId}`,
          member: member?.fullName ?? 'Member',
          status: r.status,
          registered: r.createdAt,
        };
      }),
    );

    return {
      ...this.baseResponse('registrations', fromDate, toDate, 'registrations'),
      kpis: [
        { key: 'total', label: 'Total sign-ups', value: total },
        { key: 'registered', label: 'Registered', value: registered },
        { key: 'checkedIn', label: 'Checked in', value: checkedIn },
        { key: 'cancelled', label: 'Cancelled', value: cancelled },
      ],
      trendMonths,
      trendValues,
      breakdown: statusRows.map((r) => ({
        label: r.label.replace('_', ' '),
        value: Number(r.value),
      })),
      rows,
    };
  }

  private async attendanceReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const stats = await this.registrationRepository
      .createQueryBuilder('r')
      .select('COUNT(*)', 'total')
      .addSelect(
        "SUM(CASE WHEN r.status IN ('checked_in','attended') THEN 1 ELSE 0 END)",
        'checkedIn',
      )
      .addSelect("SUM(CASE WHEN r.status = 'registered' THEN 1 ELSE 0 END)", 'registered')
      .addSelect("SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END)", 'cancelled')
      .where('r.createdAt >= :from AND r.createdAt <= :to', { from: fromDate, to: toDate })
      .getRawOne<{ total: string; checkedIn: string; registered: string; cancelled: string }>();

    const total = Number(stats?.total ?? 0);
    const checkedIn = Number(stats?.checkedIn ?? 0);
    const registered = Number(stats?.registered ?? 0);
    const attendanceRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    const noShowRate = total > 0 ? Math.round((registered / total) * 100) : 0;

    const eventStats = await this.registrationRepository
      .createQueryBuilder('r')
      .innerJoin(Event, 'e', 'e.id = r.eventId')
      .select('e.id', 'eventId')
      .addSelect('e.title', 'title')
      .addSelect('COUNT(*)', 'tickets')
      .addSelect(
        "SUM(CASE WHEN r.status IN ('checked_in','attended') THEN 1 ELSE 0 END)",
        'checkedIn',
      )
      .where('r.createdAt >= :from AND r.createdAt <= :to', { from: fromDate, to: toDate })
      .andWhere('r.status != :c', { c: 'cancelled' })
      .groupBy('e.id')
      .addGroupBy('e.title')
      .orderBy('checkedIn', 'DESC')
      .take(20)
      .getRawMany<{ eventId: string; title: string; tickets: string; checkedIn: string }>();

    const { trendMonths, trendValues } = await this.monthlyTrend(
      async (start, end) => {
        const row = await this.registrationRepository
          .createQueryBuilder('r')
          .select(
            "SUM(CASE WHEN r.status IN ('checked_in','attended') THEN 1 ELSE 0 END)",
            'checkedIn',
          )
          .where('r.createdAt >= :s AND r.createdAt <= :e', { s: start, e: end })
          .getRawOne<{ checkedIn: string }>();
        return Number(row?.checkedIn ?? 0);
      },
      fromDate,
      toDate,
    );

    return {
      ...this.baseResponse('attendance', fromDate, toDate, 'registrations'),
      kpis: [
        { key: 'total', label: 'Total tickets', value: total },
        { key: 'checkedIn', label: 'Checked in', value: checkedIn },
        { key: 'attendanceRate', label: 'Attendance rate', value: `${attendanceRate}%` },
        { key: 'noShowRate', label: 'Not checked in', value: `${noShowRate}%` },
      ],
      trendMonths,
      trendValues,
      breakdown: [
        { label: 'Checked in / attended', value: checkedIn },
        { label: 'Registered only', value: registered },
        { label: 'Cancelled', value: Number(stats?.cancelled ?? 0) },
      ],
      rows: eventStats.map((e) => {
        const tickets = Number(e.tickets);
        const checked = Number(e.checkedIn);
        const rate = tickets > 0 ? Math.round((checked / tickets) * 100) : 0;
        return {
          event: e.title,
          tickets,
          checkedIn: checked,
          attendance: `${rate}%`,
        };
      }),
    };
  }

  private async revenueReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const rows = await this.paymentRequestRepository
      .createQueryBuilder('p')
      .where('p.createdAt >= :from AND p.createdAt <= :to', { from: fromDate, to: toDate })
      .orderBy('p.createdAt', 'DESC')
      .getMany();

    const pending = rows.filter((r) => r.status === 'pending').length;
    const approved = rows.filter((r) => r.status === 'approved');
    const rejected = rows.filter((r) => r.status === 'rejected').length;
    const totalUsd = approved.reduce((sum, r) => sum + Number(r.amountUsd), 0);

    const { trendMonths, trendValues } = await this.monthlyTrend(
      async (start, end) => {
        const result = await this.paymentRequestRepository
          .createQueryBuilder('p')
          .select('COALESCE(SUM(p.amountUsd), 0)', 'total')
          .where('p.status = :s', { s: 'approved' })
          .andWhere('p.createdAt >= :from AND p.createdAt <= :to', { from: start, to: end })
          .getRawOne<{ total: string }>();
        return Number(result?.total ?? 0);
      },
      fromDate,
      toDate,
    );

    const planBreakdown = await this.paymentRequestRepository
      .createQueryBuilder('p')
      .select('p.plan', 'label')
      .addSelect('COUNT(*)', 'value')
      .where('p.status = :s', { s: 'approved' })
      .andWhere('p.createdAt >= :from AND p.createdAt <= :to', { from: fromDate, to: toDate })
      .groupBy('p.plan')
      .getRawMany<{ label: string; value: string }>();

    const detailRows = await Promise.all(
      approved.slice(0, 25).map(async (p) => {
        const profile = await this.organizerProfileRepository.findOne({
          where: { userId: p.organizerId },
        });
        return {
          organizer: profile?.organizationName ?? `#${p.organizerId}`,
          plan: p.plan,
          amount: Number(p.amountUsd),
          credits: p.creditsGranted,
          date: p.createdAt,
        };
      }),
    );

    return {
      ...this.baseResponse('revenue', fromDate, toDate, 'revenue'),
      kpis: [
        { key: 'totalUsd', label: 'Approved revenue', value: `$${totalUsd.toLocaleString()}` },
        { key: 'approved', label: 'Approved', value: approved.length },
        { key: 'pending', label: 'Pending', value: pending },
        { key: 'rejected', label: 'Rejected', value: rejected },
      ],
      trendMonths,
      trendValues,
      breakdown: planBreakdown.map((r) => ({
        label: r.label === 'bundle' ? 'Bundle ($20)' : 'Single ($5)',
        value: Number(r.value),
      })),
      rows: detailRows,
    };
  }

  private async verificationReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const [unverified, pending, approved, rejected] = await Promise.all([
      this.organizerProfileRepository.count({ where: { verificationStatus: 'unverified' } }),
      this.organizerProfileRepository.count({ where: { verificationStatus: 'pending' } }),
      this.organizerProfileRepository.count({ where: { verificationStatus: 'approved' } }),
      this.organizerProfileRepository.count({ where: { verificationStatus: 'rejected' } }),
    ]);

    const { trendMonths, trendValues } = await this.monthlyTrend(
      (start, end) =>
        this.organizerProfileRepository
          .createQueryBuilder('p')
          .where('p.verificationStatus = :s', { s: 'approved' })
          .andWhere('p.createdAt >= :from AND p.createdAt <= :to', { from: start, to: end })
          .getCount(),
      fromDate,
      toDate,
    );

    const queue = await this.organizerProfileRepository
      .createQueryBuilder('p')
      .where('p.verificationStatus IN (:...statuses)', {
        statuses: ['pending', 'unverified'],
      })
      .orderBy('p.userId', 'DESC')
      .take(25)
      .getMany();

    const rows = await Promise.all(
      queue.map(async (p) => {
        const user = await this.userRepository.findOne({ where: { id: p.userId } });
        return {
          organization: p.organizationName,
          contact: user?.fullName ?? '',
          email: user?.email ?? '',
          status: p.verificationStatus,
        };
      }),
    );

    return {
      ...this.baseResponse('verification', fromDate, toDate, null),
      kpis: [
        { key: 'pending', label: 'Pending review', value: pending },
        { key: 'unverified', label: 'Unverified', value: unverified },
        { key: 'approved', label: 'Approved', value: approved },
        { key: 'rejected', label: 'Rejected', value: rejected },
      ],
      trendMonths,
      trendValues,
      breakdown: [
        { label: 'Unverified', value: unverified },
        { label: 'Pending', value: pending },
        { label: 'Approved', value: approved },
        { label: 'Rejected', value: rejected },
      ],
      rows,
    };
  }

  private async popularEventsReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const eventStats = await this.registrationRepository
      .createQueryBuilder('r')
      .innerJoin(Event, 'e', 'e.id = r.eventId')
      .select('e.id', 'eventId')
      .addSelect('e.title', 'title')
      .addSelect('e.status', 'status')
      .addSelect('COUNT(*)', 'registrations')
      .where('r.createdAt >= :from AND r.createdAt <= :to', { from: fromDate, to: toDate })
      .andWhere('r.status != :c', { c: 'cancelled' })
      .groupBy('e.id')
      .addGroupBy('e.title')
      .addGroupBy('e.status')
      .orderBy('registrations', 'DESC')
      .take(25)
      .getRawMany<{
        eventId: string;
        title: string;
        status: string;
        registrations: string;
      }>();

    const totalRegs = eventStats.reduce((sum, e) => sum + Number(e.registrations), 0);

    const { trendMonths, trendValues } = await this.monthlyTrend(
      (start, end) =>
        this.registrationRepository
          .createQueryBuilder('r')
          .where('r.createdAt >= :s AND r.createdAt <= :e', { s: start, e: end })
          .andWhere('r.status != :c', { c: 'cancelled' })
          .getCount(),
      fromDate,
      toDate,
    );

    return {
      ...this.baseResponse('popular-events', fromDate, toDate, 'registrations'),
      kpis: [
        { key: 'events', label: 'Events with sign-ups', value: eventStats.length },
        { key: 'registrations', label: 'Total sign-ups', value: totalRegs },
        {
          key: 'top',
          label: 'Top event',
          value: eventStats[0]?.title ?? '—',
        },
        {
          key: 'topCount',
          label: 'Top event sign-ups',
          value: Number(eventStats[0]?.registrations ?? 0),
        },
      ],
      trendMonths,
      trendValues,
      breakdown: eventStats.slice(0, 8).map((e) => ({
        label: e.title.length > 28 ? `${e.title.slice(0, 28)}…` : e.title,
        value: Number(e.registrations),
      })),
      rows: eventStats.map((e) => ({
        event: e.title,
        status: e.status,
        registrations: Number(e.registrations),
      })),
    };
  }

  private async audienceReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const eventRows = await this.eventRepository
      .createQueryBuilder('e')
      .select('e.audienceGender', 'label')
      .addSelect('COUNT(*)', 'value')
      .where('e.createdAt >= :from AND e.createdAt <= :to', { from: fromDate, to: toDate })
      .groupBy('e.audienceGender')
      .getRawMany<{ label: string; value: string }>();

    const regRows = await this.registrationRepository
      .createQueryBuilder('r')
      .innerJoin(Event, 'e', 'e.id = r.eventId')
      .select('e.audienceGender', 'label')
      .addSelect('COUNT(*)', 'value')
      .where('r.createdAt >= :from AND r.createdAt <= :to', { from: fromDate, to: toDate })
      .andWhere('r.status != :c', { c: 'cancelled' })
      .groupBy('e.audienceGender')
      .getRawMany<{ label: string; value: string }>();

    const totalEvents = eventRows.reduce((s, r) => s + Number(r.value), 0);
    const totalRegs = regRows.reduce((s, r) => s + Number(r.value), 0);

    const { trendMonths, trendValues } = await this.monthlyTrend(
      (start, end) =>
        this.eventRepository
          .createQueryBuilder('e')
          .where('e.createdAt >= :s AND e.createdAt <= :e', { s: start, e: end })
          .getCount(),
      fromDate,
      toDate,
    );

    const label = (v: string) => {
      if (v === 'female') return 'Female only';
      if (v === 'male') return 'Male only';
      return 'All audiences';
    };

    return {
      ...this.baseResponse('audience', fromDate, toDate, 'events'),
      kpis: [
        { key: 'events', label: 'Events in range', value: totalEvents },
        { key: 'registrations', label: 'Sign-ups in range', value: totalRegs },
        { key: 'types', label: 'Audience types', value: eventRows.length },
        {
          key: 'topAudience',
          label: 'Most sign-ups',
          value: label(
            regRows.sort((a, b) => Number(b.value) - Number(a.value))[0]?.label ?? 'all',
          ),
        },
      ],
      trendMonths,
      trendValues,
      breakdown: regRows.map((r) => ({ label: label(r.label), value: Number(r.value) })),
      rows: eventRows.map((e) => {
        const regs =
          regRows.find((r) => r.label === e.label)?.value ?? '0';
        return {
          audience: label(e.label),
          events: Number(e.value),
          signUps: Number(regs),
        };
      }),
    };
  }

  private async locationReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const memberLocations = await this.userRepository
      .createQueryBuilder('u')
      .select('COALESCE(NULLIF(TRIM(u.location), ""), :unknown)', 'label')
      .addSelect('COUNT(*)', 'value')
      .where('u.roleId = :r', { r: MEMBER_ROLE_ID })
      .andWhere('u.createdAt >= :from AND u.createdAt <= :to', { from: fromDate, to: toDate })
      .setParameter('unknown', 'Unknown')
      .groupBy('label')
      .orderBy('value', 'DESC')
      .take(15)
      .getRawMany<{ label: string; value: string }>();

    const eventLocations = await this.eventRepository
      .createQueryBuilder('e')
      .select('COALESCE(NULLIF(TRIM(e.locationName), ""), :unknown)', 'label')
      .addSelect('COUNT(*)', 'value')
      .where('e.createdAt >= :from AND e.createdAt <= :to', { from: fromDate, to: toDate })
      .setParameter('unknown', 'Unknown')
      .groupBy('label')
      .orderBy('value', 'DESC')
      .take(15)
      .getRawMany<{ label: string; value: string }>();

    const { trendMonths, trendValues } = await this.monthlyTrend(
      (start, end) =>
        this.userRepository
          .createQueryBuilder('u')
          .where('u.roleId = :r', { r: MEMBER_ROLE_ID })
          .andWhere('u.location IS NOT NULL AND TRIM(u.location) != ""')
          .andWhere('u.createdAt >= :s AND u.createdAt <= :e', { s: start, e: end })
          .getCount(),
      fromDate,
      toDate,
    );

    const rows = memberLocations.map((m) => {
      const events =
        eventLocations.find((e) => e.label === m.label)?.value ?? '0';
      return {
        area: m.label,
        members: Number(m.value),
        events: Number(events),
      };
    });

    return {
      ...this.baseResponse('location', fromDate, toDate, null),
      kpis: [
        { key: 'areas', label: 'Member areas', value: memberLocations.length },
        {
          key: 'topArea',
          label: 'Top member area',
          value: memberLocations[0]?.label ?? '—',
        },
        {
          key: 'topCount',
          label: 'Members in top area',
          value: Number(memberLocations[0]?.value ?? 0),
        },
        {
          key: 'eventAreas',
          label: 'Event locations',
          value: eventLocations.length,
        },
      ],
      trendMonths,
      trendValues,
      breakdown: memberLocations.slice(0, 8).map((m) => ({
        label: m.label.length > 24 ? `${m.label.slice(0, 24)}…` : m.label,
        value: Number(m.value),
      })),
      rows,
    };
  }

  private async logsReport(fromDate: Date, toDate: Date): Promise<ReportSummaryResponse> {
    const [creditRows, paymentRows, suspendedUsers, cancelledEvents] = await Promise.all([
      this.creditRequestRepository
        .createQueryBuilder('c')
        .where('c.status IN (:...statuses)', { statuses: ['granted', 'dismissed'] })
        .andWhere('c.resolvedAt IS NOT NULL')
        .andWhere('c.resolvedAt >= :from AND c.resolvedAt <= :to', { from: fromDate, to: toDate })
        .orderBy('c.resolvedAt', 'DESC')
        .take(100)
        .getMany(),
      this.paymentRequestRepository
        .createQueryBuilder('p')
        .where('p.status IN (:...statuses)', { statuses: ['approved', 'rejected'] })
        .andWhere('p.updatedAt >= :from AND p.updatedAt <= :to', { from: fromDate, to: toDate })
        .orderBy('p.updatedAt', 'DESC')
        .take(100)
        .getMany(),
      this.userRepository
        .createQueryBuilder('u')
        .where('u.status = :status', { status: 'rejected' })
        .andWhere('u.updatedAt >= :from AND u.updatedAt <= :to', { from: fromDate, to: toDate })
        .andWhere('u.updatedAt > DATE_ADD(u.createdAt, INTERVAL 1 MINUTE)')
        .orderBy('u.updatedAt', 'DESC')
        .take(50)
        .getMany(),
      this.eventRepository
        .createQueryBuilder('e')
        .where('e.status = :status', { status: 'cancelled' })
        .andWhere('e.updatedAt >= :from AND e.updatedAt <= :to', { from: fromDate, to: toDate })
        .orderBy('e.updatedAt', 'DESC')
        .take(50)
        .getMany(),
    ]);

    type LogRow = {
      occurredAt: string;
      action: string;
      subject: string;
      detail: string;
    };

    const entries: LogRow[] = [];

    for (const row of creditRows) {
      entries.push({
        occurredAt: row.resolvedAt!.toISOString(),
        action: row.status === 'granted' ? 'Credits granted' : 'Credit request dismissed',
        subject: `Organizer #${row.organizerId}`,
        detail:
          row.status === 'granted'
            ? `${row.creditsGranted} credit${row.creditsGranted === 1 ? '' : 's'}${row.eventTitle ? ` · ${row.eventTitle}` : ''}`
            : row.eventTitle ?? 'Request closed',
      });
    }

    for (const row of paymentRows) {
      entries.push({
        occurredAt: row.updatedAt.toISOString(),
        action: row.status === 'approved' ? 'Payment approved' : 'Payment rejected',
        subject: `Organizer #${row.organizerId}`,
        detail: `${row.plan} · $${row.amountUsd}${row.paymentReference ? ` · ref ${row.paymentReference}` : ''}`,
      });
    }

    for (const user of suspendedUsers) {
      const role =
        user.roleId === ORGANIZER_ROLE_ID
          ? 'Organizer'
          : user.roleId === MEMBER_ROLE_ID
            ? 'Member'
            : 'User';
      entries.push({
        occurredAt: user.updatedAt.toISOString(),
        action: 'Account suspended',
        subject: `${role}: ${user.fullName}`,
        detail: user.email,
      });
    }

    for (const event of cancelledEvents) {
      entries.push({
        occurredAt: event.updatedAt.toISOString(),
        action: 'Event cancelled',
        subject: event.title,
        detail: `Event #${event.id} · organizer #${event.organizerId}`,
      });
    }

    entries.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    const actionCounts = entries.reduce<Record<string, number>>((acc, row) => {
      acc[row.action] = (acc[row.action] ?? 0) + 1;
      return acc;
    }, {});

    return {
      ...this.baseResponse('logs', fromDate, toDate, null),
      kpis: [
        { key: 'entries', label: 'Log entries', value: entries.length },
        {
          key: 'credits',
          label: 'Credit actions',
          value: creditRows.length,
        },
        {
          key: 'payments',
          label: 'Payment reviews',
          value: paymentRows.length,
        },
        {
          key: 'moderation',
          label: 'Suspensions / cancellations',
          value: suspendedUsers.length + cancelledEvents.length,
        },
      ],
      trendMonths: [],
      trendValues: [],
      breakdown: Object.entries(actionCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
      rows: entries.slice(0, 200),
    };
  }
}
