# TODO - UI Theme Consistency (EduStream)

- [x] توحيد ألوان الـ Sidebar الأساسي المستخدم في الـ dashboard: تعديل `apps/web/components/layout/sidebar.tsx` لتستعمل tokens shadcn (`bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, `bg-primary`, ...)
- [x] توحيد ألوان Sidebar البديل/القديم: تعديل `apps/web/components/ClasssideBar.tsx` لنفس المنظومة اللونية
- [x] تعديل صفحة Stream داخل الـ dashboard لتناسق layout: مراجعة `apps/web/app/(dashboard)/stream/page.tsx` وتوحيد الكونتنت

- [x] عمل search سريع بعد التعديل للتأكد من عدم بقاء ألوان ثابتة قديمة داخل الـ dashboard (مثل `bg-dark`, `bg-main/10` بشكل غير متسق)
- [ ] تشغيل `lint` و `build` للتأكد من عدم وجود أخطاء


