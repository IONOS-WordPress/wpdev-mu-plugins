import useSWRImmutable from 'swr/immutable';
import { getSiteStrings } from '@launch/api/DataApi';
import { useSiteProfile } from '@launch/hooks/useSiteProfile';

export const useSiteStrings = () => {
	const { loading, siteProfile } = useSiteProfile();
	const { data, error } = useSWRImmutable(
		loading ? null : { key: 'site-strings', ...siteProfile },
		getSiteStrings,
	);

	return { siteStrings: data, error, loading: !data && !error };
};
