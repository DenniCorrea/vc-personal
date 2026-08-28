import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador } from "@/lib/data";

const formatoData = formatador({ day: "2-digit", month: "2-digit", year: "numeric" });

export default async function PaginaAdminCheckins() {
  await exigirPapel("ADMIN");

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const adaptacoes = await prisma.checkinNutricional.findMany({
    where: { status: "ADAPTOU", criadoEm: { gte: seteDiasAtras } },
    include: { refeicao: { include: { planoNutricional: { include: { usuario: true } } } } },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Admin</p>
      <h1 className="font-display mt-1 text-[30px] text-ink">Check-ins com adaptação</h1>
      <p className="mt-2 text-[13px] text-ink-soft">Últimos 7 dias, mais recentes primeiro.</p>

      <div className="mt-6 flex flex-col gap-3">
        {adaptacoes.map((checkin) => (
          <div key={checkin.id} className="rounded-[4px] border border-line bg-card-admin p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[14px] font-medium text-ink">
                {checkin.refeicao.planoNutricional.usuario.nome}
              </p>
              <p className="text-[12px] text-ink-faint">{formatoData.format(checkin.criadoEm)}</p>
            </div>
            <p className="mt-1 text-[12px] text-ink-soft">{checkin.refeicao.nome}</p>
            <p className="mt-2 text-[13px] text-ink">&ldquo;{checkin.observacaoAdaptacao}&rdquo;</p>
            <Link
              href={`/painel/admin/alunos/${checkin.refeicao.planoNutricional.usuario.id}`}
              className="mt-2 inline-block text-[12px] font-medium text-accent"
            >
              Ver aluno
            </Link>
          </div>
        ))}
        {adaptacoes.length === 0 && (
          <p className="text-[13px] text-ink-soft">Nenhuma adaptação recente pra revisar.</p>
        )}
      </div>
    </main>
  );
}
