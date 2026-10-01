import Link from "next/link";

const options = [
  {
    href: "/register/family",
    title: "我是長輩的家人",
    description: "幫家中長輩報名課程、查看上課紀錄",
  },
  {
    href: "/register/instructor",
    title: "我想應徵講師",
    description: "送出履歷,審核通過後到據點授課",
  },
];

export default function RegisterChoosePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <p className="text-sm font-bold text-gray-900">Puli Christian Hospital</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1 mb-6">建立帳號</h1>

        <div className="space-y-3">
          {options.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className="block rounded-xl border border-gray-200 p-4 hover:border-amber-400 hover:bg-amber-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              <p className="font-semibold text-gray-900">{o.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{o.description}</p>
            </Link>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-5">
          據點人員與行政帳號由埔基統一建立,不需要自行註冊。
        </p>

        <p className="text-xs text-gray-400 text-center mt-5">
          已經有帳號了?{" "}
          <Link href="/login" className="text-amber-600 hover:underline">
            登入
          </Link>
          {" ｜ "}
          <Link href="/" className="hover:underline">
            回首頁
          </Link>
        </p>
      </div>
    </div>
  );
}
