import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Media } from './media.entity';
import { DiaryTag } from './diary-tag.entity';

export enum Mood {
  HAPPY = 'happy',
  SAD = 'sad',
  NEUTRAL = 'neutral',
  EXCITED = 'excited',
  ANGRY = 'angry',
  ANXIOUS = 'anxious',
  GRATEFUL = 'grateful',
  TIRED = 'tired',
}

@Entity('diary_entry')
export class DiaryEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mood: string | null;

  @Column({ name: 'mood_score', type: 'integer', nullable: true })
  moodScore: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  weather: string | null;

  @Column({ type: 'float', nullable: true })
  temperature: number | null;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ name: 'is_bookmarked', type: 'boolean', default: false })
  isBookmarked: boolean;

  @Column({ name: 'entry_date', type: 'varchar', length: 10 })
  entryDate: string;

  @Column({ name: 'entry_time', type: 'varchar', length: 8 })
  entryTime: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => Media, (media) => media.diaryEntry, { cascade: true })
  media: Media[];

  @OneToMany(() => DiaryTag, (diaryTag) => diaryTag.diaryEntry, {
    cascade: true,
  })
  diaryTags: DiaryTag[];
}
