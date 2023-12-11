import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { meliAuth } from "..";

export const fetch_top_stories = createAction({
	name: 'fetch_top_stories', // Must be a unique across the piece, this shouldn't be changed.
    auth: meliAuth,
    displayName:'Fetch Top Stories',
    description: 'Fetch top stories from hackernews',
	props: {
        // Properties to ask from the user, in this ask we will take number of
		number_of_stories: Property.Number({
			displayName: 'Number of Stories',
			description: undefined,
			required: true,
		})
	},
	async run(context) {
        // EXAMPLE
        const numOfStories = context.propsValue['number_of_stories'];
        const token = context.auth.access_token;

        const HACKER_NEWS_API_URL = "https://hacker-news.firebaseio.com/v0/";
        const topStoryIdsResponse = await httpClient.sendRequest<string[]>({
			method: HttpMethod.GET,
			url: `${HACKER_NEWS_API_URL}topstories.json`
		});
        const topStoryIds: string[] = topStoryIdsResponse.body;
        const topStories = [];
        for (let i = 0; i < Math.min(numOfStories!, topStoryIds.length); i++) {
          const storyId = topStoryIds[i];
          const storyResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${HACKER_NEWS_API_URL}item/${storyId}.json`
          });
          topStories.push(storyResponse.body);
        }

        return {
            topStories,
            numOfStories,
            token
        }
	},
});

