# Draft Plan: Excel Teaching Platform – Phase 1 Frontend Foundation

## User Request

> Tạo giao diện frontend cho một trang web dạy học Excel. Bước đầu tiên: tạo trang web sử dụng Next.js và Zustand, tích hợp bảng tính Excel sử dụng Univer. Tôi muốn bảng tính và các thành phần điều khiển bảng tính như thanh công cụ và các ô bảng có thể được làm mờ, thu nhỏ, phóng to, thay đổi kích thước hoặc chèn lên bởi một công cụ khác như một background (để các phiên bản sau sẽ thêm phần thông tin bài học vào chương trình bên cạnh bảng tính).

## Goal

Xây dựng nền tảng frontend ban đầu cho ứng dụng dạy học Excel tương tác: scaffold dự án Next.js + Zustand, tích hợp bảng tính Univer hoạt động đầy đủ trên trình duyệt, và thiết kế layout hỗ trợ các chế độ hiển thị (mờ / thu nhỏ / phóng to / thay đổi kích thước / bị che phủ) trên vùng bảng tính nhằm chuẩn bị cho việc xếp lớp nội dung bài học ở phiên bản sau.

## Proposed Scope

- **Scaffold dự án Next.js:** Khởi tạo dự án Next.js (App Router) với TypeScript và TailwindCSS; cấu hình `tsconfig.json`, `.eslintrc`, `.prettierrc` cơ bản.
- **Tích hợp Zustand:** Cài đặt Zustand; định nghĩa store toàn cục ban đầu quản lý trạng thái bảng tính (ví dụ: trạng thái hiển thị, kích thước, opacity của vùng bảng tính).
- **Tích hợp Univer Spreadsheet:** Cài đặt các package Univer cần thiết (`@univerjs/core`, `@univerjs/sheets`, `@univerjs/sheets-ui`, `@univerjs/ui`, v.v.); khởi tạo Univer instance trong một React component (wrapper/plugin pattern vì Univer dùng Vanilla API); đảm bảo bảng tính render đúng, hỗ trợ nhập công thức Excel cơ bản.
- **Layout chính (Shell Layout):** Tạo layout trang chủ gồm: vùng bảng tính (chiếm phần lớn màn hình) + placeholder sidebar dành cho nội dung bài học sau này; layout dùng CSS Grid hoặc Flexbox.
- **Spreadsheet Display Controls (vùng bảng tính có thể điều khiển):**
  - **Làm mờ (blur/opacity):** CSS transition thay đổi `opacity` / `filter: blur()` trên wrapper của Univer.
  - **Thu nhỏ / phóng to (minimize/maximize):** Toggle chiều cao hoặc kích thước của container Univer.
  - **Thay đổi kích thước tự do (resizable):** Dùng CSS resize hoặc một thư viện drag-resize nhẹ (ví dụ: `react-resizable-panels` hoặc `re-resizable`) để kéo thay đổi kích thước vùng bảng tính.
  - **Overlay / chèn lên (overlay layer):** Hỗ trợ hiển thị một lớp phủ bán trong suốt hoặc panel khác đè lên vùng bảng tính (dùng CSS `z-index` + absolute/fixed positioning); đây là "hook" cho phiên bản sau thêm nội dung bài học.
- **Demo page:** Tạo ít nhất một trang (`/`) hiển thị bảng tính Univer hoạt động với thanh điều khiển (blur, minimize/maximize, resize) để kiểm chứng tích hợp.

## Affected Modules / Files (estimated)

> Dự án chưa có source. Các file sau sẽ được tạo mới hoàn toàn.

- `package.json` — dependencies: Next.js, React, TypeScript, TailwindCSS, Zustand, Univer packages.
- `next.config.ts` — cấu hình webpack nếu Univer cần (ví dụ: transpile packages, alias).
- `tailwind.config.ts` — cấu hình TailwindCSS.
- `tsconfig.json` — TypeScript config.
- `app/layout.tsx` — Root layout Next.js App Router.
- `app/page.tsx` — Trang chủ, render Shell Layout + Spreadsheet.
- `app/globals.css` — Global styles + Tailwind directives.
- `components/SpreadsheetWrapper.tsx` — Component bọc Univer instance; xử lý lifecycle mount/unmount của Univer.
- `components/SpreadsheetControls.tsx` — Thanh điều khiển (blur, minimize, resize toggle) đọc/ghi Zustand store.
- `components/ShellLayout.tsx` — Layout tổng thể (spreadsheet area + sidebar placeholder).
- `components/OverlayLayer.tsx` — Component lớp phủ có thể bật/tắt đè lên bảng tính.
- `store/spreadsheetStore.ts` — Zustand store: `opacity`, `isMinimized`, `isOverlayVisible`, kích thước container.
- `docs/ARCHITECTURE.md` — Tạo mới tài liệu kiến trúc dự án (cần tạo trước khi các bước sau).

## Out of Scope

- Nội dung bài học thực tế (văn bản, video, hình ảnh hướng dẫn Excel) — dành cho phiên bản sau.
- Mascot hướng dẫn — đã đề cập nhưng chưa được yêu cầu triển khai trong bước này.
- Authentication / user accounts / progress tracking.
- Backend / API / database.
- Chức năng lưu/mở file `.xlsx` thực tế (nếu Univer không hỗ trợ sẵn trong bản OSS).
- Mobile responsive layout (ưu tiên desktop trước).
- Internationalization (i18n).

## Open Questions

1. **Phiên bản Next.js:** App Router (Next.js 14/15) hay Pages Router? *(Giả định App Router — Architect xác nhận.)*
2. **Univer render mode:** Univer mặc định dùng Canvas rendering. Việc áp `filter: blur()` lên canvas element có thể gây hiện tượng lạ. Có nên dùng một lớp `<div>` trong suốt chặn pointer events thay vì blur thực sự không? *(Architect quyết định.)*
3. **Thư viện resize:** `react-resizable-panels` (panel layout) vs `re-resizable` (tự do resize một element) vs CSS `resize: both` đơn giản? *(Architect quyết định.)*
4. **Vị trí sidebar placeholder:** Sidebar nội dung bài học nằm bên phải hay bên trái bảng tính? *(Có thể để người dùng quyết định sau, hoặc Architect đặt mặc định.)*
5. **`docs/ARCHITECTURE.md`:** Planner không tạo file này. Architect Reviewer có muốn Ticket Writer tạo file `docs/ARCHITECTURE.md` như một ticket riêng trước không, hay gộp vào ticket scaffold? *(Architect quyết định.)*
6. **Univer license:** Univer OSS dùng Apache 2.0 — không có vấn đề bản quyền cho dự án thương mại. *(Xác nhận không cần hành động.)*
7. **SSR compatibility:** Univer là thư viện client-only (dùng DOM/Canvas API). Component `SpreadsheetWrapper` cần `dynamic import` với `ssr: false` trong Next.js. Architect cần xác nhận pattern này là đủ hay cần wrapper thêm.

## Dependencies / Risks (if any)

- **Univer + Next.js SSR:** Univer không hỗ trợ SSR. Bắt buộc phải dùng `next/dynamic` với `{ ssr: false }`. Nếu không xử lý đúng sẽ gây lỗi build hoặc hydration mismatch.
- **Kích thước bundle:** Univer là thư viện lớn (nhiều sub-packages). Cần kiểm tra ảnh hưởng đến First Load JS và cân nhắc code splitting.
- **Canvas blur effect:** CSS `filter: blur()` trên canvas có thể không hoạt động như mong đợi trên một số trình duyệt. Cần prototype sớm để xác nhận khả thi.
- **Univer API stability:** Univer đang phát triển tích cực; API có thể thay đổi giữa các minor version. Cần pin version cụ thể trong `package.json`.
