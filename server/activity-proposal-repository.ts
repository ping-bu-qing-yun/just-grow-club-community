import type { RowDataPacket } from 'mysql2/promise';
import type { QiahaoDatabase } from './db';
import { toIsoTimestamp, toMysqlDateTime } from './db';

export type ActivityProposalStatus = 'draft' | 'submitted' | 'accepted' | 'rejected' | 'withdrawn';

export class ActivityProposalError extends Error {
  constructor(public readonly status: 400 | 404, public readonly code: 'VALIDATION_ERROR' | 'NOT_FOUND', message: string) {
    super(message);
    this.name = 'ActivityProposalError';
  }
}

type ProposalRow = RowDataPacket & {
  id: string; host_user_id: string; host_name: string; source_need_id: string | null; title: string;
  category: string; category_label: string; description: string; status: ActivityProposalStatus;
  reviewed_by: string | null; reviewer_name: string | null; reviewed_at: string | null;
  review_note: string | null; archived_at: string | null; created_at: string; updated_at: string;
};

function toProposal(row: ProposalRow) {
  return {
    id: row.id,
    host: { id: row.host_user_id, name: row.host_name },
    sourceNeedId: row.source_need_id,
    title: row.title,
    categoryKey: row.category,
    categoryLabel: row.category_label,
    description: row.description,
    status: row.status,
    reviewedBy: row.reviewed_by ? { id: row.reviewed_by, name: row.reviewer_name ?? '' } : null,
    reviewedAt: row.reviewed_at ? toIsoTimestamp(row.reviewed_at) : null,
    reviewNote: row.review_note,
    archivedAt: row.archived_at ? toIsoTimestamp(row.archived_at) : null,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}

const proposalSelect = `
  SELECT p.*,host.name AS host_name,reviewer.name AS reviewer_name,COALESCE(c.label,p.category) AS category_label
    FROM activity_proposals p
    JOIN users host ON host.id=p.host_user_id
    LEFT JOIN users reviewer ON reviewer.id=p.reviewed_by
    LEFT JOIN activity_category_configs c ON c.config_key=p.category`;

export async function listActivityProposals(database: QiahaoDatabase, input: { status?: ActivityProposalStatus; includeArchived?: boolean } = {}) {
  const conditions = [input.includeArchived ? '1=1' : 'p.archived_at IS NULL'];
  const params: unknown[] = [];
  if (input.status) { conditions.push('p.status=?'); params.push(input.status); }
  const rows = await database.query<ProposalRow[]>(
    `${proposalSelect} WHERE ${conditions.join(' AND ')} ORDER BY p.updated_at DESC,p.id DESC`,
    params,
  );
  return rows.map(toProposal);
}

export async function getActivityProposal(database: QiahaoDatabase, id: string) {
  const rows = await database.query<ProposalRow[]>(`${proposalSelect} WHERE p.id=? LIMIT 1`, [id]);
  return rows[0] ? toProposal(rows[0]) : null;
}

export async function updateActivityProposal(
  database: QiahaoDatabase,
  id: string,
  actorId: string,
  patch: { title?: string; categoryKey?: string; description?: string; status?: ActivityProposalStatus; reviewNote?: string },
) {
  const current = await getActivityProposal(database, id);
  if (!current) return null;
  const title = patch.title?.trim() ?? current.title;
  const category = patch.categoryKey?.trim() ?? current.categoryKey;
  const description = patch.description?.trim() ?? current.description;
  const reviewNote = patch.reviewNote === undefined ? current.reviewNote : patch.reviewNote.trim();
  const status = patch.status ?? current.status;
  if (!['draft', 'submitted', 'accepted', 'rejected', 'withdrawn'].includes(status)) throw new ActivityProposalError(400, 'VALIDATION_ERROR', '提案状态无效');
  if (!title || title.length > 255 || !description || description.length > 20_000 || (reviewNote?.length ?? 0) > 5_000) throw new ActivityProposalError(400, 'VALIDATION_ERROR', '提案字段格式无效');
  if (patch.categoryKey !== undefined && category !== current.categoryKey) {
    const categories = await database.query<RowDataPacket[]>(
      'SELECT 1 FROM activity_category_configs WHERE config_key=? AND enabled=1 LIMIT 1',
      [category],
    );
    if (!categories.length) throw new ActivityProposalError(400, 'VALIDATION_ERROR', '活动分类不存在或已停用');
  }
  const now = toMysqlDateTime();
  await database.query(
    `UPDATE activity_proposals
        SET title=?,category=?,description=?,status=?,reviewed_by=?,reviewed_at=?,review_note=?,updated_at=?
      WHERE id=?`,
    [title, category, description, status, actorId, now, reviewNote || null, now, id],
  );
  return getActivityProposal(database, id);
}

export async function archiveActivityProposal(database: QiahaoDatabase, id: string, actorId: string): Promise<boolean> {
  const now = toMysqlDateTime();
  const result = await database.query<import('mysql2/promise').ResultSetHeader>(
    `UPDATE activity_proposals
        SET archived_at=COALESCE(archived_at,?),reviewed_by=?,reviewed_at=?,updated_at=?
      WHERE id=?`,
    [now, actorId, now, now, id],
  );
  return result.affectedRows > 0;
}
