import { google } from 'googleapis';
import { extractFileId } from '../../utils/helpers.js';

export const createAndPublishAsset = async (meta, keywords, folderId, oauth2Client, drive, driveV2) => {
      let title = keywords[meta.keyField] || '';
      if (!title.trim()) {
        title = `${meta.keyLabel} (Chưa điền)`;
      }

      let mimeType = 'application/vnd.google-apps.document';
      if (meta.type === 'spreadsheet') mimeType = 'application/vnd.google-apps.spreadsheet';
      else if (meta.type === 'presentation') mimeType = 'application/vnd.google-apps.presentation';
      else if (meta.type === 'form') mimeType = 'application/vnd.google-apps.form';
      else if (meta.type === 'drawing') mimeType = 'application/vnd.google-apps.drawing';

      try {
        let fileId = '';
        let driveUrl = '';

        if (meta.type === 'form') {
          // Tạo bằng Google Forms API v1
          const formsApi = google.forms({ version: 'v1', auth: oauth2Client });
          const newForm = await formsApi.forms.create({
            requestBody: {
              info: {
                title: title
              }
            }
          });
          fileId = newForm.data.formId;

          try {
            await drive.files.update({
              fileId: fileId,
              addParents: folderId,
              requestBody: {
                name: title
              },
              fields: 'id, parents, name'
            });
          } catch (moveErr) {
            console.error(`Không thể di chuyển và đặt tên Form:`, moveErr.message);
          }

          const formFile = await drive.files.get({
            fileId: fileId,
            fields: 'webViewLink'
          });
          driveUrl = formFile.data.webViewLink;
        } else {
          // Tạo mới file rỗng
          const fileMetadata = {
            name: title,
            mimeType: mimeType,
            parents: [folderId]
          };
          const file = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name, webViewLink'
          });
          fileId = file.data.id;
          driveUrl = file.data.webViewLink;
        }

        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });

        let pubUrl = '';
        if (meta.type !== 'form') {
          try {
            const revList = await driveV2.revisions.list({ fileId: fileId });
            const revisions = revList.data.items || [];
            const revisionId = revisions.length > 0 ? revisions[revisions.length - 1].id : '1';

            const revUpdate = await driveV2.revisions.update({
              fileId: fileId,
              revisionId: revisionId,
              resource: {
                published: true,
                publishAuto: true
              }
            });

            pubUrl = revUpdate.data.publishedLink || driveUrl;
          } catch (revErr) {
            console.error(`Không thể publish revision cho ${title}:`, revErr.message);
            pubUrl = driveUrl;
          }
        } else {
          pubUrl = `https://docs.google.com/forms/d/${fileId}/viewform`;
        }

        return {
          keyField: meta.keyField + (meta.type !== 'document' ? `_${meta.type}` : ''),
          keyLabel: meta.keyLabel,
          title: title,
          type: meta.type,
          driveUrl: driveUrl,
          pubUrl: pubUrl,
          checked: false
        };
      } catch (err) {
        console.error(`Lỗi khi tạo tài sản ${title}:`, err.message);
        return {
          keyField: meta.keyField,
          keyLabel: meta.keyLabel,
          title: title,
          type: meta.type,
          driveUrl: '',
          pubUrl: '',
          error: err.message,
          checked: false
        };
      }
    };
