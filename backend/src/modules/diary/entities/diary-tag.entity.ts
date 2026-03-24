import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { DiaryEntry } from './diary-entry.entity';
import { Tag } from '../../tag/entities/tag.entity';

@Entity('diary_tag')
export class DiaryTag {
  @PrimaryColumn({ name: 'diary_entry_id', type: 'varchar', length: 36 })
  diaryEntryId: string;

  @PrimaryColumn({ name: 'tag_id', type: 'varchar', length: 36 })
  tagId: string;

  @ManyToOne(() => DiaryEntry, (diaryEntry) => diaryEntry.diaryTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diary_entry_id' })
  diaryEntry: DiaryEntry;

  @ManyToOne(() => Tag, (tag) => tag.diaryTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
