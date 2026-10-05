-- Jumpsuit Release Forms - Database Schema
-- Run this in your Supabase SQL editor

-- Templates table
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  legal_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  default_template_id UUID REFERENCES templates(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'wrapped')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Releases (signed waivers) table
CREATE TABLE releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES templates(id) NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_phone TEXT,
  signer_address TEXT,
  signature_data TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  ip_address TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Public read on templates (needed for signing flow)
CREATE POLICY "Templates are viewable by everyone" ON templates
  FOR SELECT USING (true);

-- Public read on projects (needed for signing flow)
CREATE POLICY "Projects are viewable by everyone" ON projects
  FOR SELECT USING (true);

-- Public insert on releases (signers can submit)
CREATE POLICY "Anyone can create a release" ON releases
  FOR INSERT WITH CHECK (true);

-- Public read on releases (for admin - will add auth later)
CREATE POLICY "Releases are viewable by everyone" ON releases
  FOR SELECT USING (true);

-- Public update/delete on projects (admin - will add auth later)
CREATE POLICY "Projects can be managed" ON projects
  FOR ALL USING (true);

-- Public delete on releases (admin - will add auth later)
CREATE POLICY "Releases can be managed" ON releases
  FOR ALL USING (true);

-- Seed the 4 release templates
INSERT INTO templates (name, slug, legal_text) VALUES
(
  'Production Release',
  'production-release',
  E'PARTICIPANT RELEASE AGREEMENT\n\nThis is a Participant Release Agreement between Jumpsuit Agency (PRODUCTION COMPANY) and the undersigned (PARTICIPANT).\n\nPRODUCTION COMPANY AND PARTICIPANT AGREE AS FOLLOWS:\n\n1. PARTICIPANT assigns to PRODUCTION COMPANY the right to record PARTICIPANT''S voice and likeness for use in a media production ("Production") associated with the project named above. Recordings may be used for future promotional content for the company, culture, and/or mission of Jumpsuit and its network.\n\n2. In assigning the rights in this Agreement PARTICIPANT grants to PRODUCTION COMPANY and its successors, assigns, and licensees the full and irrevocable right to produce, copy, distribute, exhibit or transmit PARTICIPANT''S voice and likeness in connection with the Production by means of broadcast or cablecast videotape, film, audiotape or any electronic or mechanical method now known or hereafter devised.\n\n3. PARTICIPANT acknowledges that any picture or recording taken of PARTICIPANT under the terms of this Agreement becomes the sole and exclusive property of PRODUCTION COMPANY in perpetuity and throughout the world and includes the right to transfer or sub-license to our affiliates and partners.\n\n4. PARTICIPANT further acknowledges that PRODUCTION COMPANY has the right to use PARTICIPANT''S name, portrait, voice, or biographical information to promote or publicize the Production, and to authorize others to do the same. PARTICIPANT agrees that no photographs, footage, or other material need be submitted to them for approval prior to usage.\n\n5. PARTICIPANT agrees that this release is not and in no way represents a promise or guarantee of consequent employment or remuneration. PARTICIPANT also agrees that nothing requires PRODUCTION COMPANY to use PARTICIPANT''S name, voice, or likeness in any of the manners described or to exercise any of the rights in this Agreement.\n\n6. PARTICIPANT warrants that PARTICIPANT is free to enter into this Agreement, and that this Agreement does not conflict with any existing contracts or agreements to which PARTICIPANT is a party. PARTICIPANT agrees to hold PRODUCTION COMPANY and any third parties harmless from and against any and all claims, liabilities, losses, or damages that may arise from the use of PARTICIPANT''S voice or image in the Production.\n\n7. PARTICIPANT acknowledges that this Agreement is not valid or binding upon PRODUCTION COMPANY until signed by a representative of the PRODUCTION COMPANY.'
),
(
  'Liability Waiver',
  'liability-waiver',
  E'RELEASE OF LIABILITY\n\nREAD CAREFULLY - THIS AFFECTS YOUR LEGAL RIGHTS\n\nIn exchange for participation in the activity organized by Spirit Animal Consulting dba Jumpsuit Agency, of 386 Green Harbor Rd, Old Hickory, Tennessee, 37138 and/or use of the property, facilities and services of Spirit Animal Consulting dba Jumpsuit Agency, I, the undersigned, agree for myself and (if applicable) for the members of my family, to the following:\n\n1. AGREEMENT TO FOLLOW DIRECTIONS. I agree to observe and obey all posted rules and warnings, and further agree to follow any oral instructions or directions given by Spirit Animal Consulting dba Jumpsuit Agency, or the employees, representatives or agents of Spirit Animal Consulting dba Jumpsuit Agency.\n\n2. ASSUMPTION OF THE RISKS AND RELEASE. I recognize that there are certain inherent risks associated with the above described activity and I assume full responsibility for personal injury to myself and (if applicable) my family members, and further release and discharge Spirit Animal Consulting dba Jumpsuit Agency for injury, loss or damage arising out of my or my family''s use of or presence upon the facilities of Spirit Animal Consulting dba Jumpsuit Agency, whether caused by the fault of myself, my family, Spirit Animal Consulting dba Jumpsuit Agency or other third parties.\n\n3. INDEMNIFICATION. I agree to indemnify and defend Spirit Animal Consulting dba Jumpsuit Agency against all claims, causes of action, damages, judgments, costs or expenses, including attorney fees and other litigation costs, which may in any way arise from my or my family''s use of or presence upon the facilities of Spirit Animal Consulting dba Jumpsuit Agency.\n\n4. FEES. I agree to pay for all damages to the facilities of Spirit Animal Consulting dba Jumpsuit Agency caused by any negligent, reckless, or willful actions by me or my family.\n\n5. APPLICABLE LAW. Any legal or equitable claim that may arise from participation in the above shall be resolved under Tennessee law.\n\n6. NO DURESS. I agree and acknowledge that I am under no pressure or duress to sign this Agreement and that I have been given a reasonable opportunity to review it before signing. I further agree and acknowledge that I am free to have my own legal counsel review this Agreement if I so desire.\n\n7. ARM''S LENGTH AGREEMENT. This Agreement and each of its terms are the product of an arm''s length negotiation between the Parties. In the event any ambiguity is found to exist in the interpretation of this Agreement, or any of its provisions, the Parties, and each of them, explicitly reject the application of any legal or equitable rule of interpretation which would lead to a construction either "for" or "against" a particular party based upon their status as the drafter of a specific term, language, or provision giving rise to such ambiguity.\n\n8. ENFORCEABILITY. The invalidity or unenforceability of any provision of this Agreement, whether standing alone or as applied to a particular occurrence or circumstance, shall not affect the validity or enforceability of any other provision of this Agreement or of any other applications of such provision, as the case may be, and such invalid or unenforceable provision shall be deemed not to be a part of this Agreement.\n\n9. DISPUTE RESOLUTION. The parties will attempt to resolve any dispute arising out of or relating to this Agreement through friendly negotiations amongst the parties. If the matter is not resolved by negotiation, the parties will resolve the dispute using the below Alternative Dispute Resolution (ADR) procedure. Any controversies or disputes arising out of or relating to this Agreement will be submitted to mediation in accordance with any statutory rules of mediation. If mediation is not successful in resolving the entire dispute or is unavailable, any outstanding issues will be submitted to final and binding arbitration under the rules of the American Arbitration Association. The arbitrator''s award will be final, and judgment may be entered upon it by any court having proper jurisdiction.\n\nI HAVE READ THIS DOCUMENT AND UNDERSTAND IT. I FURTHER UNDERSTAND THAT BY SIGNING THIS RELEASE, I VOLUNTARILY SURRENDER CERTAIN LEGAL RIGHTS.'
),
(
  'Event Waiver',
  'event-waiver',
  E'WAIVER, RELEASE OF LIABILITY, AND MEDIA CONSENT AGREEMENT\n\nBy signing below, I acknowledge that I am voluntarily choosing to participate in the event hosted by Spirit Animal Consulting, LLC DBA Jumpsuit ("Jumpsuit"). I understand that this is an immersive experience that may include physical, emotional, psychological, and spiritual activities. I hereby agree to the following terms:\n\n1. VOLUNTARY PARTICIPATION AND ASSUMPTION OF RISK. I understand the nature of the Event and acknowledge that participation involves certain risks, including but not limited to physical exertion, emotional intensity, or other unexpected circumstances. I voluntarily assume full responsibility for any risks, injuries, or damages that may occur as a result of my participation.\n\n2. RELEASE OF LIABILITY. To the fullest extent allowed by law, I release, indemnify, and hold harmless Jumpsuit, its officers, employees, contractors, facilitators, and affiliates from any and all claims, actions, damages, liabilities, costs, or expenses (including attorney fees) arising from or related to my participation in the Event, including but not limited to injury, illness, loss, theft, or property damage.\n\n3. MEDIA RELEASE. I grant Jumpsuit the irrevocable right to record, film, photograph, or otherwise capture my image, voice, and likeness during the Event. I authorize the use of such media for any lawful purpose including but not limited to marketing, promotion, social media, and commercial use, without compensation or further approval. I waive any right to inspect or approve the final content.\n\n4. MEDICAL DISCLAIMER. I understand that Jumpsuit is not a licensed medical provider and that no part of the Event constitutes medical or psychological treatment. I am responsible for managing my own physical, mental, and emotional wellbeing during the Event. I certify that I am physically and emotionally able to participate and will inform facilitators of any relevant conditions.\n\n5. CODE OF CONDUCT. I agree to respect the physical, emotional, and energetic boundaries of all participants and facilitators. I understand that if my behavior is disruptive, harmful, or unsafe, I may be removed from the Event without refund.\n\n6. JURISDICTION. This agreement shall be governed by and construed in accordance with the laws of the State of Tennessee, and any disputes shall be resolved in that jurisdiction.\n\nBy signing below, I confirm I have read, understood, and agree to all the above terms.'
),
(
  'Universal Release',
  'universal-release',
  E'UNIVERSAL RELEASE AND WAIVER AGREEMENT\n\nThis is a combined Participant Release, Liability Waiver, and Media Consent Agreement between Spirit Animal Consulting, LLC DBA Jumpsuit Agency ("Jumpsuit" / "PRODUCTION COMPANY") and the undersigned ("PARTICIPANT").\n\nPART 1 - MEDIA RELEASE\n\n1. PARTICIPANT assigns to PRODUCTION COMPANY the right to record PARTICIPANT''S voice and likeness for use in a media production ("Production") associated with the project named above. Recordings may be used for future promotional content for the company, culture, and/or mission of Jumpsuit and its network.\n\n2. In assigning the rights in this Agreement PARTICIPANT grants to PRODUCTION COMPANY and its successors, assigns, and licensees the full and irrevocable right to produce, copy, distribute, exhibit or transmit PARTICIPANT''S voice and likeness in connection with the Production by means of broadcast or cablecast videotape, film, audiotape or any electronic or mechanical method now known or hereafter devised.\n\n3. PARTICIPANT acknowledges that any picture or recording taken of PARTICIPANT under the terms of this Agreement becomes the sole and exclusive property of PRODUCTION COMPANY in perpetuity and throughout the world and includes the right to transfer or sub-license to our affiliates and partners.\n\n4. PARTICIPANT further acknowledges that PRODUCTION COMPANY has the right to use PARTICIPANT''S name, portrait, voice, or biographical information to promote or publicize the Production, and to authorize others to do the same. PARTICIPANT agrees that no photographs, footage, or other material need be submitted to them for approval prior to usage.\n\nPART 2 - LIABILITY WAIVER\n\n5. VOLUNTARY PARTICIPATION AND ASSUMPTION OF RISK. I understand the nature of the activity and acknowledge that participation involves certain risks, including but not limited to physical exertion, emotional intensity, or other unexpected circumstances. I voluntarily assume full responsibility for any risks, injuries, or damages that may occur as a result of my participation.\n\n6. RELEASE OF LIABILITY. To the fullest extent allowed by law, I release, indemnify, and hold harmless Jumpsuit, its officers, employees, contractors, facilitators, and affiliates from any and all claims, actions, damages, liabilities, costs, or expenses (including attorney fees) arising from or related to my participation, including but not limited to injury, illness, loss, theft, or property damage.\n\n7. INDEMNIFICATION. I agree to indemnify and defend Jumpsuit against all claims, causes of action, damages, judgments, costs or expenses, including attorney fees and other litigation costs, which may in any way arise from my use of or presence upon the facilities of Jumpsuit.\n\nPART 3 - GENERAL TERMS\n\n8. PARTICIPANT agrees that this release is not and in no way represents a promise or guarantee of consequent employment or remuneration.\n\n9. PARTICIPANT warrants that PARTICIPANT is free to enter into this Agreement, and that this Agreement does not conflict with any existing contracts or agreements to which PARTICIPANT is a party.\n\n10. MEDICAL DISCLAIMER. I understand that Jumpsuit is not a licensed medical provider and that no part of any event constitutes medical or psychological treatment. I am responsible for managing my own physical, mental, and emotional wellbeing.\n\n11. CODE OF CONDUCT. I agree to respect the physical, emotional, and energetic boundaries of all participants and facilitators. I understand that if my behavior is disruptive, harmful, or unsafe, I may be removed without refund.\n\n12. APPLICABLE LAW. Any legal or equitable claim that may arise from participation shall be resolved under Tennessee law.\n\n13. DISPUTE RESOLUTION. The parties will attempt to resolve any dispute through friendly negotiations. If not resolved, disputes will be submitted to mediation, and if unsuccessful, to final and binding arbitration under the rules of the American Arbitration Association.\n\n14. ENFORCEABILITY. The invalidity or unenforceability of any provision shall not affect the validity or enforceability of any other provision.\n\nI HAVE READ THIS DOCUMENT AND UNDERSTAND IT. I FURTHER UNDERSTAND THAT BY SIGNING THIS RELEASE, I VOLUNTARILY SURRENDER CERTAIN LEGAL RIGHTS.'
);
