-- Create storage buckets for DigiHealth files
INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-reports', 'lab-reports', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('medicine-images', 'medicine-images', true) ON CONFLICT DO NOTHING;

-- Storage policies for member-photos (public read)
CREATE POLICY "member_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'member-photos');
CREATE POLICY "member_photos_authenticated_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'member-photos');
CREATE POLICY "member_photos_authenticated_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'member-photos');
CREATE POLICY "member_photos_authenticated_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'member-photos');

-- Storage policies for prescriptions (authenticated only)
CREATE POLICY "prescriptions_authenticated_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'prescriptions');
CREATE POLICY "prescriptions_authenticated_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'prescriptions');
CREATE POLICY "prescriptions_authenticated_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'prescriptions');
CREATE POLICY "prescriptions_authenticated_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'prescriptions');

-- Storage policies for lab-reports
CREATE POLICY "lab_reports_authenticated_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'lab-reports');
CREATE POLICY "lab_reports_authenticated_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lab-reports');
CREATE POLICY "lab_reports_authenticated_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'lab-reports');
CREATE POLICY "lab_reports_authenticated_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lab-reports');

-- Storage policies for documents
CREATE POLICY "documents_authenticated_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "documents_authenticated_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "documents_authenticated_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "documents_authenticated_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- Storage policies for medicine-images
CREATE POLICY "medicine_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'medicine-images');
CREATE POLICY "medicine_images_authenticated_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medicine-images');
CREATE POLICY "medicine_images_authenticated_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'medicine-images');
CREATE POLICY "medicine_images_authenticated_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'medicine-images');
