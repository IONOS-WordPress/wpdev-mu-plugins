import { formatSiteQuestionsForAPI } from '@shared/utils/format-site-questions-for-api';

describe('formatSiteQuestionsForAPI', () => {
	it('should return an empty array if siteQA is undefined', () => {
		expect(formatSiteQuestionsForAPI(undefined)).toEqual([]);
	});

	it('should return an empty array if siteQA.questions is not an array', () => {
		expect(formatSiteQuestionsForAPI({ questions: null })).toEqual([]);
		expect(formatSiteQuestionsForAPI({ questions: {} })).toEqual([]);
	});

	it('should return an empty array if siteQA.questions is empty', () => {
		expect(formatSiteQuestionsForAPI({ questions: [] })).toEqual([]);
	});

	it('should format questions using answerUser if available', () => {
		const input = {
			questions: [{ question: 'What is your name?', answerUser: 'John' }],
		};
		expect(formatSiteQuestionsForAPI(input)).toEqual([
			{ question: 'What is your name?', answer: 'John' },
		]);
	});

	it('should fall back to answerAI if answerUser is not present', () => {
		const input = {
			questions: [{ question: 'What is your name?', answerAI: 'AI-John' }],
		};
		expect(formatSiteQuestionsForAPI(input)).toEqual([
			{ question: 'What is your name?', answer: 'AI-John' },
		]);
	});

	it('should fall back to empty answer if neither answerUser nor answerAI is present', () => {
		const input = {
			questions: [{ question: 'What is your name?' }],
		};
		expect(formatSiteQuestionsForAPI(input)).toEqual([
			{ question: 'What is your name?', answer: '' },
		]);
	});

	it('should fall back to empty question string if question is undefined', () => {
		const input = {
			questions: [{ answerUser: 'John' }],
		};
		expect(formatSiteQuestionsForAPI(input)).toEqual([
			{ question: '', answer: 'John' },
		]);
	});
});
