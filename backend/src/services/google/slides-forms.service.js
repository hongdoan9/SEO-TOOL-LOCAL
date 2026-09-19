import { google } from 'googleapis';
import { extractFileId } from '../../utils/helpers.js';

export async function optimizeSingleSlide(slides, docs, docId, slideId, keywords, transKeys, lsi11Val, lang, langObj, step4Data, step4Images, stack) {

          // Tạo 3 Text Box trên Slide 1
          const box1Id = `slide1_box1_${Date.now()}`;
          const box2Id = `slide1_box2_${Date.now()}`;
          const box3Id = `slide1_box3_${Date.now()}`;

          // Box 1 (Tiêu đề lớn)
          contentRequests.push({
            createShape: {
              objectId: box1Id,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slide1Id,
                size: {
                  width: { magnitude: 640, unit: 'PT' },
                  height: { magnitude: 70, unit: 'PT' }
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 40,
                  translateY: 20,
                  unit: 'PT'
                }
              }
            }
          });
          // Xóa viền và nền của Shape để giống Textbox
          contentRequests.push({
            updateShapeProperties: {
              objectId: box1Id,
              shapeProperties: {
                outline: { propertyState: 'NOT_RENDERED' },
                shapeBackgroundFill: { propertyState: 'NOT_RENDERED' }
              },
              fields: 'outline,shapeBackgroundFill'
            }
          });

          // Box 2 (Liên kết thực thể)
          contentRequests.push({
            createShape: {
              objectId: box2Id,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slide1Id,
                size: {
                  width: { magnitude: 310, unit: 'PT' },
                  height: { magnitude: 280, unit: 'PT' }
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 40,
                  translateY: 100,
                  unit: 'PT'
                }
              }
            }
          });
          contentRequests.push({
            updateShapeProperties: {
              objectId: box2Id,
              shapeProperties: {
                outline: { propertyState: 'NOT_RENDERED' },
                shapeBackgroundFill: { propertyState: 'NOT_RENDERED' }
              },
              fields: 'outline,shapeBackgroundFill'
            }
          });

          // Box 3 (Tài sản chéo)
          contentRequests.push({
            createShape: {
              objectId: box3Id,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slide1Id,
                size: {
                  width: { magnitude: 310, unit: 'PT' },
                  height: { magnitude: 280, unit: 'PT' }
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 370,
                  translateY: 100,
                  unit: 'PT'
                }
              }
            }
          });
          contentRequests.push({
            updateShapeProperties: {
              objectId: box3Id,
              shapeProperties: {
                outline: { propertyState: 'NOT_RENDERED' },
                shapeBackgroundFill: { propertyState: 'NOT_RENDERED' }
              },
              fields: 'outline,shapeBackgroundFill'
            }
          });

          // Ghi văn bản vào Box 1
          const lsi11Val = keywords.lsi_11 || 'LSI keywords 11';
          contentRequests.push({
            insertText: {
              objectId: box1Id,
              text: lsi11Val
            }
          });
          // Định dạng Box 1 cỡ chữ 52pt, in đậm, căn giữa
          contentRequests.push({
            updateTextStyle: {
              objectId: box1Id,
              style: {
                fontSize: { magnitude: 52, unit: 'PT' },
                bold: true
              },
              fields: 'fontSize,bold'
            }
          });
          contentRequests.push({
            updateParagraphStyle: {
              objectId: box1Id,
              style: {
                alignment: 'CENTER'
              },
              fields: 'alignment'
            }
          });

          // Xây dựng văn bản & Index Hyperlink cho Box 2 (Liên kết thực thể)
          const itemsB = [
            { label: 'Website: ', url: stack.url || '', anchor: keyChinhVal },
            { label: 'Google site view: ', url: siteViewLink, anchor: keyChinhVal },
            { label: 'Google My Maps: ', url: myMapsLink, anchor: keyChinhLocalVal },
            { label: 'GMB post: ', url: gmbLink, anchor: keyChinhVal },
            { label: 'Youtube: ', url: youtubeLink, anchor: lsi1Val },
            { label: 'Twitter: ', url: twitterLink, anchor: lsi2Val },
            { label: 'Pinterest: ', url: pinterestLink, anchor: lsi3Val },
            { label: `${row7Name}: `, url: row7Link, anchor: lsi4Val },
            { label: 'Drive Folder: ', url: driveFolderLink, anchor: keyChinhVal },
            { label: 'Google Sheet link: ', url: sheetLink, anchor: keyChinhVal },
            { label: 'Drive folder image: ', url: imageFolderLink, anchor: keyChinhVal }
          ];

          let textB = '';
          const stylesB = [];

          itemsB.forEach(item => {
            if (item.url) {
              const startIdx = textB.length + item.label.length;
              const endIdx = startIdx + item.anchor.length;
              textB += `${item.label}${item.anchor}\n`;
              stylesB.push({ startIdx, endIdx, url: item.url });
            } else {
              textB += `${item.label}\n`;
            }
          });

          // Ghi text B vào Box 2
          contentRequests.push({
            insertText: {
              objectId: box2Id,
              text: textB
            }
          });
          // Set font size 11 cho toàn bộ Box 2 và căn lề trái
          contentRequests.push({
            updateTextStyle: {
              objectId: box2Id,
              style: {
                fontSize: { magnitude: 11, unit: 'PT' }
              },
              fields: 'fontSize'
            }
          });
          contentRequests.push({
            updateParagraphStyle: {
              objectId: box2Id,
              style: {
                alignment: 'START'
              },
              fields: 'alignment'
            }
          });
          // Apply link cho từng neo từ khóa của Box 2
          stylesB.forEach(st => {
            contentRequests.push({
              updateTextStyle: {
                objectId: box2Id,
                textRange: {
                  type: 'FIXED_RANGE',
                  startIndex: st.startIdx,
                  endIndex: st.endIdx
                },
                style: {
                  link: { url: st.url },
                  underline: true
                },
                fields: 'link,underline'
              }
            });
          });

          // Xây dựng văn bản & Index Hyperlink cho Box 3 (Tài sản chéo)
          const itemsC = [
            { label: 'Google sheet: ', url: lsi10SheetUrl, anchor: lsi10Val },
            { label: 'Google slide: ', url: slideAsset.driveUrl || '', anchor: lsi11Val },
            { label: 'Google Forms: ', url: lsi12FormUrl, anchor: lsi12Val },
            { label: 'Google Drawing: ', url: lsi13DrawingUrl, anchor: lsi13Val },
            { label: 'Calendar: ', url: lsi14CalendarUrl, anchor: lsi14Val }
          ];

          let textC = '';
          const stylesC = [];

          itemsC.forEach(item => {
            if (item.url) {
              const startIdx = textC.length + item.label.length;
              const endIdx = startIdx + item.anchor.length;
              textC += `${item.label}${item.anchor}\n`;
              stylesC.push({ startIdx, endIdx, url: item.url });
            } else {
              textC += `${item.label}\n`;
            }
          });

          // Ghi text C vào Box 3
          contentRequests.push({
            insertText: {
              objectId: box3Id,
              text: textC
            }
          });
          // Set font size 11 cho toàn bộ Box 3 và căn lề trái
          contentRequests.push({
            updateTextStyle: {
              objectId: box3Id,
              style: {
                fontSize: { magnitude: 11, unit: 'PT' }
              },
              fields: 'fontSize'
            }
          });
          contentRequests.push({
            updateParagraphStyle: {
              objectId: box3Id,
              style: {
                alignment: 'START'
              },
              fields: 'alignment'
            }
          });
          // Apply link cho từng neo từ khóa của Box 3
          stylesC.forEach(st => {
            contentRequests.push({
              updateTextStyle: {
                objectId: box3Id,
                textRange: {
                  type: 'FIXED_RANGE',
                  startIndex: st.startIdx,
}

export async function optimizeSingleForm(forms, docs, docId, formId, keywords, transKeys, lsi12Val, lang, langObj, step4Data, stack, brand, phone, address, modelName) {
                  translateY: 40,
                  unit: 'PT'
                }
              }
            }
          });
          contentRequests.push({
            updateShapeProperties: {
              objectId: slide2BoxId,
              shapeProperties: {
                outline: { propertyState: 'NOT_RENDERED' },
                shapeBackgroundFill: { propertyState: 'NOT_RENDERED' }
              },
              fields: 'outline,shapeBackgroundFill'
            }
          });

          contentRequests.push({
            insertText: {
              objectId: slide2BoxId,
              text: rawLsi11Text
            }
          });
          contentRequests.push({
            updateTextStyle: {
              objectId: slide2BoxId,
              style: {
                fontSize: { magnitude: 10, unit: 'PT' }
              },
              fields: 'fontSize'
            }
          });
          contentRequests.push({
            updateParagraphStyle: {
              objectId: slide2BoxId,
              style: {
                alignment: 'START'
              },
              fields: 'alignment'
            }
          });

          // --- THIẾT LẬP SLIDE 3 ĐẾN SLIDE 14 (NHÚNG 12 ẢNH) ---
          for (let i = 0; i < 12; i++) {
            const slideId = finalSlideIds[i + 2];
            const slide = finalSlides[i + 2];
            if (!slideId) continue;

            if (slide && slide.pageElements) {
              slide.pageElements.forEach(el => {
                contentRequests.push({ deleteObject: { objectId: el.objectId } });
              });
            }

            const img = step4Images[i];
            if (img && img.driveFileId) {
              const directImgUrl = `https://lh3.googleusercontent.com/d/${img.driveFileId}`;
              contentRequests.push({
                createImage: {
                  elementProperties: {
                    pageObjectId: slideId,
                    size: {
                      width: { magnitude: 640, unit: 'PT' },
                      height: { magnitude: 325, unit: 'PT' }
                    },
                    transform: {
                      scaleX: 1,
                      scaleY: 1,
                      translateX: 40,
                      translateY: 40,
                      unit: 'PT'
                    }
                  },
                  url: directImgUrl
                }
              });
            }
          }

          // Thực hiện tất cả các batchUpdate của Slide
          if (contentRequests.length > 0) {
            await slidesApi.presentations.batchUpdate({
              presentationId,
              requestBody: { requests: contentRequests }
            });
          }

          slideResult = {
            keyField: 'lsi_11_presentation',
            title: lsi11Val,
            status: 'success',
            driveUrl: slideAsset.driveUrl,
            optimizedAt: new Date().toISOString()
          };

        } catch (slideErr) {
          console.error("Lỗi khi tối ưu Google Slides:", slideErr);
          slideResult = {
            keyField: 'lsi_11_presentation',
            title: keywords.lsi_11 || 'LSI keywords 11',
            status: 'error',
            message: slideErr.message
          };
        }
      }
    }

    // --- GIAI ĐOẠN 6: TỐI ƯU HÓA GOOGLE FORMS (LSI 12) ---
    // Nạp lại assets mới từ DB vì Slides vừa cập nhật assets
    const freshStack = await query.get('SELECT assets FROM google_stacks WHERE id = ?', [id]);
    const currentAssets = freshStack.assets ? JSON.parse(freshStack.assets) : assets;
    
    const formAsset = currentAssets.find(a => a.keyField === 'lsi_12_form');
    let formResult = null;

    if (formAsset && formAsset.driveUrl) {
      const formId = extractFileId(formAsset.driveUrl);
      if (formId) {
        try {
          const formsApi = google.forms({ version: 'v1', auth: oauth2Client });

          // 1. Đọc bài viết gốc của Docs lsi_12
          const lsi12DocAsset = currentAssets.find(a => a.keyField === 'lsi_12');
          let rawLsi12Text = '';
          if (lsi12DocAsset && lsi12DocAsset.driveUrl) {
            const lsi12DocId = extractFileId(lsi12DocAsset.driveUrl);
            if (lsi12DocId) {
              try {
                const docData = await docs.documents.get({ documentId: lsi12DocId });
                const freshDoc = docData.data;
                const namedRanges = freshDoc.namedRanges || {};
                const optRange = namedRanges['opt_zone']?.namedRanges[0]?.ranges?.[0];
                const relRange = namedRanges['rel_zone']?.namedRanges[0]?.ranges?.[0];

                if (freshDoc.body && freshDoc.body.content) {
                  freshDoc.body.content.forEach(element => {
                    if (element.paragraph && element.paragraph.elements) {
                      const isInsideOpt = optRange && (element.startIndex >= optRange.startIndex && element.endIndex <= optRange.endIndex);
                      const isInsideRel = relRange && (element.startIndex >= relRange.startIndex && element.endIndex <= relRange.endIndex);

                      if (!isInsideOpt && !isInsideRel) {
                        element.paragraph.elements.forEach(el => {
                          if (el.textRun && el.textRun.content) {
                            rawLsi12Text += el.textRun.content;
                          }
                        });
                      }
                    }
                  });
                }
              } catch (docErr) {
                console.error("Lỗi khi đọc file Docs của LSI 12:", docErr.message);
              }
            }
          }
          if (!rawLsi12Text) rawLsi12Text = 'Nội dung bài viết LSI 12 trống.';

          const lsi12Val = keywords.lsi_12 || 'LSI keywords 12';

          // 2. Dựng nội dung mô tả biểu mẫu (Form Description)
          const formDescriptionLines = [
            rawLsi12Text,
            "",
            `Website: ${stack.url || ''}`,
            `Google site view: ${siteViewLink}`,
            `Google My Maps: ${myMapsLink}`,
            `GMB post: ${gmbLink}`,
            `Youtube: ${youtubeLink}`,
            `Twitter: ${twitterLink}`,
            `Pinterest: ${pinterestLink}`,
            `${row7Name}: ${row7Link}`,
            `Drive Folder: ${driveFolderLink}`,
            `Google Sheet link: ${sheetLink}`,
            `Drive folder image: ${imageFolderLink}`,
            "",
            "Thông tin liên quan:",
            `Google sheet: ${lsi10SheetUrl}`,
            `Google slide: ${slideAsset?.driveUrl || ''}`,
            `Google Forms: ${formAsset.driveUrl}`,
}
