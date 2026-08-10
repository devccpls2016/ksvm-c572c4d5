ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_scope text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS access_districts text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS access_talukas text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS access_villages text[] NOT NULL DEFAULT '{}'::text[];

CREATE OR REPLACE FUNCTION public.survey_in_user_scope(_user_id uuid, _district text, _taluka text, _village text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND p.is_active
      AND (
        p.access_scope = 'all'
        OR (p.access_scope = 'district' AND _district = ANY (p.access_districts))
        OR (p.access_scope = 'taluka'
            AND _district = ANY (p.access_districts)
            AND _taluka = ANY (p.access_talukas))
        OR (p.access_scope = 'village'
            AND _district = ANY (p.access_districts)
            AND _taluka = ANY (p.access_talukas)
            AND _village = ANY (p.access_villages))
      )
  )
$$;

DROP POLICY IF EXISTS surveys_select_own_or_admin ON public.surveys;
CREATE POLICY surveys_select_own_or_admin ON public.surveys
FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.survey_in_user_scope(auth.uid(), district, taluka, village)
);