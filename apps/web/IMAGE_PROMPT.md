# Image Generation Prompt for "How It Works" Section

## Image Description

A modern, minimalist illustration showing the hiring workflow process from job posting to candidate onboarding.

## Detailed Prompt for AI Image Generation:

**For DALL-E, Midjourney, or Stable Diffusion:**

```
Modern minimalist illustration, flat design style, showing a hiring workflow process.
Four connected steps displayed horizontally:
1) Job posting with document icon and search symbol,
2) AI screening with sparkle/star icons and candidate profiles,
3) Review process with checkmarks and shortlisted candidates,
4) Interview and onboarding with calendar and handshake icons.
Clean, professional design with soft gradients, blue and purple color scheme,
white background, corporate style, vector illustration,
suitable for tech company website, modern UI/UX design,
no text labels, just visual icons and flow arrows connecting the steps.
```

**Alternative Prompt (More Detailed):**

```
Professional hiring process infographic illustration, modern flat design,
showing 4-step workflow:
Step 1 - Job posting (document with magnifying glass),
Step 2 - AI screening (robot/automation icon with candidate profiles),
Step 3 - Review and shortlist (checkmark with star ratings),
Step 4 - Interview and hire (calendar with handshake).
Connected with flowing arrows, soft blue and purple gradients,
minimalist style, clean white background,
tech company aesthetic, vector art,
suitable for SaaS landing page, professional and friendly tone.
```

## Image Specifications:

- **Aspect Ratio**: 4:3 (or 16:9 for wider display)
- **Style**: Modern, minimalist, flat design
- **Colors**: Blue, purple gradients, white background
- **Format**: PNG or SVG (preferred for web)
- **Size**: Minimum 1200x900px (or 1920x1080px for 16:9)
- **No text**: Just visual icons and flow

## Where to Place the Image:

Once generated, save the image as `hiring-process.png` or `hiring-process.svg` in:

```
hr-platform/apps/web/public/hiring-process.png
```

Then update the image placeholder in `page.tsx` by replacing the placeholder div with:

```tsx
<Image
  src="/hiring-process.png"
  alt="Hiring Process Workflow"
  width={800}
  height={600}
  className="rounded-xl"
/>
```

Don't forget to import Image from next/image at the top of the file.
