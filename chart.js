async function drawChart() {
  // access data
  const dataset = await d3.tsv("world_cup_geo.tsv")
  const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")

  attendanceAccessor = d => +d.attendance

  // create chart dimensions
  const width = 1050
  let dimensions = {
    width: width,
    height: width * 0.6,
    margin: {
      top: 20,
      right: 20,
      bottom: 50,
      left: 50
    }
  }

  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

  // draw canvas
  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  let bounds = wrapper.append("g")
    .style("transform", `translate(${
      dimensions.margin.left
    }px, ${
      dimensions.margin.top
    }px)`)

  // create scales
  const attendanceScale = d3.scaleLinear()
    .domain(d3.extent(dataset, attendanceAccessor))
    .range([3, 30])

  // draw data
  const projection = d3.geoMercator()
    .scale(200)
    .translate([dimensions.boundedWidth / 2, dimensions.boundedHeight / 2]);
  const path = d3.geoPath()
    .projection(projection)
  const map = bounds.selectAll("path")
    .data(topojson.feature(world, world.objects.countries).features)
    .enter().append("path")
      .attr("d", path)
      .attr("class", "country")

  bounds.selectAll("circle")
    .data(dataset)
    .enter().append("circle")
      .attr("cx", d => projection([d.long, d.lat])[0])
      .attr("cy", d => projection([d.long, d.lat])[1])
      .on("mouseenter", onMouseEnter)
      .on("mousemove", onMouseMove)
      .on("mouseleave", onMouseLeave)
      .attr("class", "dot")
      .attr("r", d => attendanceScale(attendanceAccessor(d)))

  // set up interactions
  const tooltip = d3.select("#tooltip")
    .attr("class", "tooltip")

  function onMouseEnter() {
    d = d3.select(this).datum()
    tooltip.select("#teams")
      .text(`${d.team1} vs ${d.team2} (${d.goals})`)
    tooltip.select("#attendance")
      .text(`Attendance: ${attendanceAccessor(d).toLocaleString()}`)
    tooltip.select("#year")
      .text(`Year: ${d.year}`)
    tooltip.select("#stadium")
      .text(`Stadium: ${d.stadium}`)
    tooltip.style("opacity", 0.9)
  }

  function onMouseMove() {
    tooltip.style("left", `${event.pageX + 20}px`)
    tooltip.style("top", `${event.pageY}px`)
  }

  function onMouseLeave() {
    tooltip.style("opacity", 0)
  }
}

drawChart()
