document.addEventListener('DOMContentLoaded', (event) => {
    onLoad().catch(console.log)
});

async function onLoad() {
    let [data] = await Promise.all([
        d3.csv('data/company-profits.csv', data => ({
            company: data['Company'],
            industry: data['Industry'],
            income: +data['2016 Net Income'],
            ranking: +data['Fortune 500 Rank'],
            profit: +data['Profit/Second']
        })),
        // d3.json('data/links.json'),
    ]);

    // Data processing
    data = data.sort((a, b) => b.profit - a.profit).slice(0, 5);
    const industryNames = new Set();
    data.forEach(companyProfit => industryNames.add(companyProfit.industry));

    const tooltip = d3.select('#tooltip');

    (function chart1(){
        const viewBoxHeight = 500
        const viewBoxWidth = 800
        const marginX = 50
        const marginY = 20
        const height = viewBoxHeight - marginY * 2
        const width = viewBoxWidth - marginX * 2

        const svg = d3.select('#dataChart1')
            .append('svg')
            .attr('viewBox', [0, 0, viewBoxWidth, viewBoxHeight])
            .append('g')
            .attr('transform', `translate(${marginX}, ${marginY})`)
        const svgDefs = svg.append('defs');


        // Scales
        const colourIndustry = d3.schemePastel1
        const colourScale = d3.scaleOrdinal(colourIndustry)
            .domain(industryNames.values())
        const sizeMinIncome = 10
        const sizeMaxIncome = 30
        const sizeScale = d3.scaleLinear()
            .domain(d3.extent(data.map(c => c.income)))
            .range([sizeMinIncome, sizeMaxIncome]);

        // Chart stuff
        (function chart() {
            // const chartMarginX = 40
            const chartMarginLeft = 40
            const chartMarginRight = 20
            const chartMarginY = 40
            const chartWidth = width - chartMarginLeft - chartMarginRight
            const chartHeight = height - chartMarginY * 2

            const svgChart = svg.append('g')
                .attr('transform', `translate(${chartMarginLeft}, ${chartMarginY})`);

            // x-axis
            const xAxis = d3.scaleLinear()
                .domain([0, d3.max(data.map(c => c.ranking))]).nice()
                .range([0, chartWidth]);

            // y-axis
            const yAxis = d3.scaleLinear()
                .domain([0, d3.max(data.map(c => c.profit))]).nice()
                .range([chartHeight, 0]);

            // Data points
            svgChart.append('g')
                .attr('id', 'chart1-plot')
                .selectAll('circle')
                .data(data)
                .enter()
                .append('circle')
                .attr('class', 'chart1-plot-data chart-plot-data-hover')
                .attr('data-industry', d => d.industry)
                .attr('data-company', d => d.company)
                .attr('fill', d => colourScale(d.industry))
                .attr('r', d => sizeScale(d.income))
                .attr('cx', d => xAxis(d.ranking))
                .attr('cy', d => yAxis(d.profit))

            // Labels
            // x-axis
            svgChart.append('g')
                .attr('id', 'chart1-axis-x')
                .attr('transform', `translate(0, ${chartHeight})`)
                .call(d3.axisBottom(xAxis));
            svgChart.append('text')
                .attr('fill', 'currentColor')
                .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + 40})`)
                .attr('text-anchor', 'middle')
                .attr('font-size', '1rem')
                .text('Fortune 500 Rank');
            // y-axis
            svgChart.append('g')
                .attr('id', 'chart1-axis-y')
                .call(d3.axisLeft(yAxis).tickFormat(d3.format("-$,.2f")));
            svgChart.append('text')
                .attr('fill', 'currentColor')
                .attr('transform', `translate(${-chartMarginLeft - 30}, ${chartHeight / 2}) rotate(270)`)
                .attr('text-anchor', 'middle')
                .attr('font-size', '1rem')
                .text('Profits per second');
        })();


        // Legend (Income / Side)
        (function legendSide() {
            const legendOuterRightPadding = 10
            const legendOuterTopPadding = 40
            const legendInnerXPadding = 10
            const legendInnerYPadding = 10

            const svgLegend = svg.append('g')
                .attr('id', 'chart1-legend-side');
            const svgLegendTitle = svgLegend.append('text')
                .attr('id', 'chart1-legend-side-title')
                .attr('fill', 'currentColor')
                .attr('dominant-baseline', 'hanging')
                .attr('font-size', '0.9rem')
                .text('2016 Net Income');
            const bboxLegendTitle = svgLegendTitle.node().getBBox();
            // Groups all channels into 1
            const svgLegendChannels = svgLegend.append('g')
                .attr('id', 'chart1-legend-side-channels')
                .attr('transform', `translate(0, ${bboxLegendTitle.y + bboxLegendTitle.height + legendInnerYPadding})`);

            const [sizeScaleMin, sizeScaleMax] = sizeScale.range();
            const sizeScaleMid = (sizeScaleMin + sizeScaleMax) / 2;
            const sizeScales = [sizeScaleMin, sizeScaleMid, sizeScaleMax];

            // Groups the size + label into a channel
            const svgLegendChannel = svgLegendChannels.selectAll('g')
                .data(sizeScales)
                .enter()
                .append('g')
                .attr('class', 'chart1-legend-side-channel')
                .attr('transform', (d, i) => `translate(0, ${d3.sum(sizeScales.slice(0, i)) * 2 + legendInnerYPadding * i})`)
                .attr('data-channel', d => d);
            svgLegendChannel.append('circle')
                .attr('class', 'chart1-legend-side-channel-illustration')
                .attr('cx', sizeScaleMax)
                .attr('cy', d => d)
                .attr('r', d => d);
            svgLegendChannel.append('text')
                .attr('class', 'chart1-legend-side-channel-label')
                .attr('x', sizeScaleMax * 2 + legendInnerXPadding)
                .attr('y', d => d)
                .attr('text-anchor', 'left')
                .attr('dominant-baseline', 'middle')
                .attr('fill', 'currentColor')
                .attr('font-size', '0.7rem')
                .text(d => d3.format("-$~s")(sizeScale.invert(d)).replace('G', 'B'));

            // Calculating the legend width
            let legendWidth = Math.max(bboxLegendTitle.width, d3.max(svgLegendChannels.selectAll('g').nodes(), n => n.getBBox().width));
            svgLegendTitle.attr('transform', `translate(${legendWidth / 2}, 0)`)
                .attr('text-anchor', 'middle');

            svgLegend.attr('transform', `translate(${width - legendWidth - legendOuterRightPadding}, ${legendOuterTopPadding})`);
        })();

        (function legendTop() {
            const legendCircleSize = 10

            const legendInnerXPadding = 5
            const legendBetweenXPadding = 15

            const svgLegend = svg.append('g')
                .attr('id', 'chart1-legend-top');
            const svgLegendChannels = svgLegend.append('g')
                .attr('id', 'chart1-legend-top-channels');

            const svgLegendChannel = svgLegendChannels.selectAll('g')
                .data(industryNames.values())
                .enter()
                .append('g')
                .attr('class', 'chart1-legend-top-channel')
                .attr('data-channel', d => d);
            svgLegendChannel.append('circle')
                .attr('class', 'chart1-legend-top-channel-illustration')
                .attr('cx', legendCircleSize)
                .attr('cy', legendCircleSize)
                .attr('r', legendCircleSize)
                .attr('fill', d => colourScale(d));
            svgLegendChannel.append('text')
                .attr('class', 'chart1-legend-top-channel-label')
                .attr('x', legendCircleSize * 2 + legendInnerXPadding)
                .attr('y', legendCircleSize)
                .attr('text-anchor', 'left')
                .attr('dominant-baseline', 'middle')
                .attr('fill', 'currentColor')
                .attr('font-size', '0.7rem')
                .text(d => d);

            svgLegendChannel.attr('transform', (d, i) => `translate(${d3.sum(svgLegendChannels.selectAll('.chart1-legend-top-channel').nodes().splice(0, i), d => d.getBBox().width) + legendBetweenXPadding * i}, 0)`);
            svgLegendChannels.attr('transform', `translate(${(width - svgLegendChannels.node().getBBox().width) / 2}, 0)`);
        })();
    })();

    (function chart2(){
        const viewBoxHeight = 500
        const viewBoxWidth = 800
        const marginX = 50
        const marginY = 20
        const height = viewBoxHeight - marginY * 2
        const width = viewBoxWidth - marginX * 2

        const svg = d3.select('#dataChart2')
            .append('svg')
            .attr('viewBox', [0, 0, viewBoxWidth, viewBoxHeight])
            .append('g')
            .attr('transform', `translate(${marginX}, ${marginY})`)
        const svgDefs = svg.append('defs');
    })();
}
