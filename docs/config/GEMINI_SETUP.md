# Gemini API Setup Guide

## API Key Configuration

Your Gemini API key has been configured in the app config. To use it:

1. **Set Environment Variable** (Recommended):
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyBe2lUFOBEHhNkGce-lPPYy0-b48GyKu6o
   ```

2. **Or Update Config Directly**:
   Edit `config/app.config.ts` and set:
   ```typescript
   gemini: {
     apiKey: 'AIzaSyBe2lUFOBEHhNkGce-lPPYy0-b48GyKu6o',
     // ...
   }
   ```

## Free Tier Limits

Gemini Free Tier includes:
- **60 requests per minute**
- **15 million tokens per day**
- **1,500 requests per day** (approximate)

The app is configured with conservative limits:
- 60 requests per day (to stay well under the limit)
- 15M tokens per day
- 60 requests per minute

## Admin Panel

Access the admin panel at `/admin` to:
- Monitor API usage in real-time
- View usage graphs and statistics
- See warnings when approaching limits
- Reset daily usage counters

## Rate Limiting

The app automatically:
- Tracks requests per day
- Tracks requests per minute
- Estimates token usage
- Blocks requests when limits are reached
- Shows helpful error messages

## Usage Tracking

Usage is tracked in:
- `localStorage` (browser storage)
- Resets daily automatically
- Persists across page refreshes
- Accessible via admin panel

## Preventing Limit Exceeded

1. **Monitor Regularly**: Check `/admin` dashboard
2. **Set Lower Limits**: Adjust `freeTierLimits` in config if needed
3. **Use Caching**: Reuse AI responses when possible
4. **Optimize Prompts**: Shorter prompts = fewer tokens
5. **Enable Fallbacks**: App uses placeholder data when API is unavailable

## Configuration

Edit `config/app.config.ts`:

```typescript
gemini: {
  enabled: true,
  model: 'gemini-pro',
  maxTokens: 1000,
  temperature: 0.7,
  freeTierLimits: {
    requestsPerDay: 60,        // Adjust as needed
    tokensPerDay: 15000000,    // 15M tokens
    requestsPerMinute: 60,     // Gemini's limit
  },
}
```

## Troubleshooting

**API Not Working?**
- Check API key is set correctly
- Verify key has proper permissions
- Check browser console for errors
- Ensure `.env.local` is loaded (restart dev server)

**Hitting Limits?**
- Check admin panel for current usage
- Reduce `requestsPerDay` in config
- Implement request caching
- Use shorter prompts

**Admin Panel Not Showing Data?**
- Clear browser localStorage
- Refresh the page
- Check browser console for errors
