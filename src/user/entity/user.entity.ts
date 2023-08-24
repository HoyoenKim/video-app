import { RefreshToken } from "../../auth/entity/refresh-token.entity";
import { Video } from "../../video/entity/video.entity";
import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "../enum/user.enum";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    //@Column()
    @Column({ unique: true })
    // unique -> auto index, index not exist -> do not searching with it.
    email: string;

    @Column()
    password: string;

    @Column({ type: 'enum', enum: Role })
    role: Role = Role.User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Video, (video) => video.user)
    videos: Video[];

    @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
    refreshToken: RefreshToken;
}