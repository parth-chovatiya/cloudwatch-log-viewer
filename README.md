# AWS CloudWatch Log Viewer

A modern, fast, and user-friendly web UI for searching and visualizing AWS CloudWatch logs. Built with Next.js, TypeScript, TailwindCSS, and AWS SDK v3.

---

## Features

- 🔍 **Search CloudWatch Logs** by group, stream, time range, and filter pattern
- 🧠 **Advanced Search**: Compose complex filter patterns, use quick templates, and combine criteria
- 📊 **Log Analytics**: Visualize log volume, error rates, log level distribution, and stream activity
- ⚡ **Virtualized Lists**: Handles thousands of log groups/streams efficiently
- 💾 **Export Results**: Download logs as JSON
- 🛡️ **Accessible UI**: Keyboard navigation, ARIA labels, and responsive design

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-username/cloudwatch-log-viewer.git
cd cloudwatch-log-viewer
npm install
```

### 2. Configure AWS Credentials

Create a `.env` file (see `.env.example`) with your AWS credentials and region:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

> **Note:** Use an IAM user with `CloudWatchLogsReadOnlyAccess` or similar permissions.

### 3. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. **Select a Log Group**: Start typing to search, then pick from the dropdown.
2. **(Optional) Select a Log Stream**: Further narrow your search.
3. **Set Filters**: Use filter patterns, time range, or advanced search.
4. **Search Logs**: Click "Search Logs" to fetch and display results.
5. **Export**: Download results as JSON.
6. **Visualize**: Use the analytics tab for charts and stats.

---

## Customization

- **UI**: TailwindCSS for easy theming.
- **API**: See `app/api/cloudwatch/route.ts` for backend logic.
- **Components**: Modular React components in `app/components/`.

---

## Deployment

Deploy on [Vercel](https://vercel.com/) or any platform supporting Next.js. Set your AWS credentials as environment variables in your deployment settings.

---

## Troubleshooting

- **No logs found?**
  - Check AWS credentials and permissions.
  - Ensure the selected log group/stream exists and has recent events.
- **API errors?**
  - Check `.env` values and AWS region.
  - Review server logs for stack traces.
- **UI issues?**
  - Clear browser cache or try incognito mode.

---

## Contributing

PRs and issues welcome! Please open an issue to discuss major changes first.

---

## Tech Stack

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [@tanstack/react-virtual](https://tanstack.com/virtual/v3)
- [Recharts](https://recharts.org/)

## License

MIT
