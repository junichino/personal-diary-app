import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('app_setting')
export class AppSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pin_hash', type: 'varchar', length: 255 })
  pinHash: string;

  @Column({
    name: 'app_name',
    type: 'varchar',
    length: 100,
    default: 'My Diary',
  })
  appName: string;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Bangkok' })
  timezone: string;

  @Column({ name: 'dark_mode', type: 'boolean', default: false })
  darkMode: boolean;

  @Column({ name: 'auto_lock_minutes', type: 'integer', default: 5 })
  autoLockMinutes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
