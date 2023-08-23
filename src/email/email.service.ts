import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { Video } from 'src/video/entity/video.entity';

@Injectable()
export class EmailService {
    constructor(
        private readonly mailerService: MailerService,
    ) {}

    async send(videos: Video[]) {
        const data = videos.map(({ id, title, downloadCnt }) => {
            return `<tr><td>${id}</td><td>${title}</td><td>${downloadCnt}</td></tr><br>`;
        });
        await this.mailerService.sendMail({
            from: 'cabinkhy2@gmail.com',
            to: 'cabinkhy2@gmail.com',
            subject: 'Video App Test Email',
            html: `
            <table style="border: 1px solid black; width: 60%; margin: auto; text-align: center">
            <tr><th>id</th><th>name</th><th><th>title</th><th></tr>
            ${data}
            </table>
            `,
        })
    }
}
