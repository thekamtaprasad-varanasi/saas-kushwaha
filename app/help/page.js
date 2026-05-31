import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const sections = [
  {
    icon: "⚙️",
    title: "पहली बार सेटअप",
    steps: [
      "Settings में जाएं — क्लिनिक का नाम, पता, फोन, डॉक्टर का नाम और qualification भरें।",
      "Receptionist, Pharmacy, Psychologist का 10 अंक का मोबाइल नंबर डालें — PIN अपने आप आखिरी 6 अंकों से बन जाएगी।",
      "स्टाफ बदलने पर Settings में जाकर पुराना नंबर और PIN हटा दें, नया डालें।",
    ],
  },
  {
    icon: "🩺",
    title: "मरीज की पर्ची बनाना",
    steps: [
      "Queue में Receptionist द्वारा add किया मरीज दिखेगा — नाम पर क्लिक करें।",
      "Complaints और Diagnosis भरें।",
      "दवाइयां चुनें — नाम टाइप करते ही सुझाव आएंगे। Dose, frequency, duration भरें।",
      "Follow-up date डालें और Save करें।",
      "Print बटन से पर्ची print करें या WhatsApp से भेजें।",
    ],
  },
  {
    icon: "📋",
    title: "Templates",
    steps: [
      "किसी diagnosis के लिए दवाइयां भरने के बाद Template Save करें।",
      "अगली बार वही diagnosis डालते ही दवाइयां automatically load हो जाएंगी।",
      "Templates manage करने के लिए Settings में जाएं।",
    ],
  },
  {
    icon: "🧠",
    title: "Psychologist का काम",
    steps: [
      "Receptionist मरीज को Psychologist queue में भेजेगा।",
      "Psychologist PHQ-9, GAD-7, DASS-21, MDQ जैसे rating scales भरेगा।",
      "Assessment पूरी होने पर 'Send to Doctor' करेगा — Doctor को result automatically दिखेगा।",
    ],
  },
  {
    icon: "📋",
    title: "H1 Register",
    steps: [
      "Schedule H1 दवाइयां पर्ची में add होते ही automatically register में दर्ज हो जाती हैं।",
      "H1 Register page से list देख सकते हैं और print कर सकते हैं।",
    ],
  },
  {
    icon: "🔔",
    title: "WhatsApp Reminder",
    steps: [
      "Follow-up date आने पर मरीज को WhatsApp reminder जाएगा।",
      "Reminders page से manually भी message भेज सकते हैं।",
    ],
  },
  {
    icon: "🏥",
    title: "Receptionist का काम",
    steps: [
      "Reception page पर जाएं — मरीज का नाम और फोन नंबर डालें।",
      "Doctor queue या Psychologist queue में भेजें।",
      "पुराने मरीज का नाम या फोन से खोजें — दोबारा add करने की जरूरत नहीं।",
    ],
  },
  {
    icon: "💊",
    title: "Pharmacy का काम",
    steps: [
      "Doctor की पर्ची Pharmacy queue में आएगी — दवाइयां दें।",
      "Dispensed mark करने के बाद queue से हट जाएगा।",
      "Walk-in sale के लिए Walk-in page use करें।",
      "Brands page पर generic दवा के brand map करें।",
    ],
  },
];

export default async function HelpPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="pt-4 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">सहायता</h1>
        <p className="text-gray-500 text-sm mt-1">Psychiatrist Pro उपयोग गाइड</p>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((sec, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{sec.icon}</span>
              <h2 className="text-base font-bold text-gray-800">{sec.title}</h2>
            </div>
            <ol className="flex flex-col gap-2">
              {sec.steps.map((step, j) => (
                <li key={j} className="flex gap-3 text-sm text-gray-600">
                  <span className="bg-indigo-100 text-indigo-700 font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {j + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}